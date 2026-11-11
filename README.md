# DinoPark CTF

Desafio de CTF em Docker. O objetivo é encontrar as flags no formato `TAC{...}`.

Você **não precisa clonar este repositório**. Use apenas os comandos abaixo no terminal.

## 1. Baixar a imagem

```bash
docker pull gibi177/dinopark-ctf:1.2
```

## 2. Rodar o desafio

```bash
docker compose up -d
```

## 3. Acessar

Resolva normalmente, usando localhost como IP-alvo. (Portas 80 para HTTP e 2222 para SSH).

## 4. Parar e remover

```bash
docker compose down
```

Para jogar novamente, execute o comando do passo 2.

## Observações

- Se as portas `8080` ou `2222` estiverem ocupadas, altere apenas a porta do host (primeiro valor do parâmetro -p, à esquerda de ":"). Não modifique as portas do container (80 e 22), pois os serviços do CTF dependem delas para funcionar:

  ```bash
  docker run -d --name dinopark-ctf -p 8081:80 -p 2223:22 gibi177/dinopark-ctf:1.2
  ```

- Ataque apenas o container do desafio. Não ataque o host, a rede ou outros alunos.
- Se a imagem não baixar, confirme que o Docker está rodando.
- Para ver os logs do container: `docker compose logs`.
