# DinoPark CTF

Desafio de CTF em Docker. O objetivo é encontrar as flags no formato `TAC{...}`.

Você **não precisa clonar este repositório**. Use apenas os comandos abaixo.

## 1. Baixar a imagem

```bash
docker pull gibi177/dinopark-ctf:1.0
```

## 2. Rodar o desafio

```bash
docker run -d --name dinopark-ctf \
  -p 8080:80 \
  -p 2222:22 \
  gibi177/dinopark-ctf:1.0
```

## 3. Acessar

Resolva normalmente, usando localhost como IP.

## 4. Parar e remover

```bash
docker rm -f dinopark-ctf
```

Para jogar novamente, execute o comando do passo 2.

## Observações

- Se as portas `8080` ou `2222` estiverem ocupadas, troque apenas o lado esquerdo:

  ```bash
  docker run -d --name dinopark-ctf -p 8081:80 -p 2223:22 gibi177/dinopark-ctf:1.0
  ```

- Ataque apenas o container do desafio. Não ataque o host, a rede ou outros alunos.
- Se a imagem não baixar, confirme que o Docker está rodando.
- Para ver os logs do container: `docker logs dinopark-ctf`.
