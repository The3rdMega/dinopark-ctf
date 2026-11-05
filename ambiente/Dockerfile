# Usa a versão exata vulnerável ao Path Traversal (CVE-2021-41773)
FROM httpd:2.4.49

LABEL maintainer="Grupo CTF - Tópicos Avançados"

# ---------------------------------------------------------
# CORREÇÃO PARA O DEBIAN BUSTER (REPOSITÓRIOS ARQUIVADOS)
# ---------------------------------------------------------
RUN echo "deb http://archive.debian.org/debian/ buster main" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    echo "Acquire::Check-Valid-Until false;" > /etc/apt/apt.conf.d/99no-check-valid-until

# Atualiza repositórios e instala serviços necessários
RUN apt-get update && \
    apt-get install -y openssh-server sudo steghide wget \
    binutils libimage-exiftool-perl file xxd binwalk && \
    apt-get clean

# Configuração essencial do SSH
RUN mkdir /var/run/sshd

# Adiciona o Banner SSH (MOTD - Message of the Day) corporativo
RUN echo "===================================================" > /etc/motd && \
    echo " ATENCAO: SISTEMA DA DINOPARK CORPORATION" >> /etc/motd && \
    echo " Acesso restrito. Todas as atividades sao monitoradas." >> /etc/motd && \
    echo "===================================================" >> /etc/motd

# ---------------------------------------------------------
# ETAPA 1: CRIAÇÃO DOS USUÁRIOS E SENHAS
# ---------------------------------------------------------
# Usuário 1: estagiario_ti (Senha fraca para o Hydra quebrar - presente na rockyou.txt)
RUN useradd -m -s /bin/bash estagiario_ti && \
    echo "estagiario_ti:welcome" | chpasswd

# Adiciona o histórico de comandos falso (Red Herring) para o estagiário
RUN echo "ping 8.8.8.8" > /home/estagiario_ti/.bash_history && \
    echo "steghide --help" >> /home/estagiario_ti/.bash_history && \
    echo "echo 'preciso avisar o chefe sobre a foto' > notas.txt" >> /home/estagiario_ti/.bash_history && \
    echo "rm notas.txt" >> /home/estagiario_ti/.bash_history && \
    chown estagiario_ti:estagiario_ti /home/estagiario_ti/.bash_history

# Usuário 2: fotografo (Senha complexa que será escondida)
RUN useradd -m -s /bin/bash fotografo && \
    echo "fotografo:Sup3rS3cr3tD1n0P4ssw0rd!" | chpasswd

# ---------------------------------------------------------
# ETAPA 2: CONFIGURAÇÃO DAS VULNERABILIDADES (WEB E PRIVESC)
# ---------------------------------------------------------
# Força a permissão global no final do arquivo para garantir o Path Traversal
RUN echo "<Directory />" >> /usr/local/apache2/conf/httpd.conf && \
    echo "    AllowOverride None" >> /usr/local/apache2/conf/httpd.conf && \
    echo "    Require all granted" >> /usr/local/apache2/conf/httpd.conf && \
    echo "</Directory>" >> /usr/local/apache2/conf/httpd.conf
# Habilita o Path Traversal modificando o controle de acesso do Apache
# Troca o "Require all denied" do diretório raiz para "Require all granted"
RUN sed -i 's/Require all denied/Require all granted/g' /usr/local/apache2/conf/httpd.conf

# Deixa o nome do usuário visível no index para a fase de enumeração
COPY dinopark-site/*.html /usr/local/apache2/htdocs/
COPY dinopark-site/css/ /usr/local/apache2/htdocs/css/
COPY dinopark-site/js/ /usr/local/apache2/htdocs/js/
COPY dinopark-site/assets/ /usr/local/apache2/htdocs/assets/

# PrivEsc: Permite que o 'fotografo' execute 'scp' como root sem senha via sudo
RUN echo "fotografo ALL=(ALL) NOPASSWD: /usr/bin/scp" >> /etc/sudoers

# ---------------------------------------------------------
# ETAPA 3: ESTEGANOGRAFIA (MOVIMENTAÇÃO LATERAL)
# ---------------------------------------------------------
RUN mkdir -p /home/estagiario_ti/backups_camera
# Baixa uma imagem de placeholder (Vocês podem colocar uma foto legal de dinossauro na pasta do projeto e usar COPY)
COPY ultimo_clique.jpg /home/estagiario_ti/backups_camera/ultimo_clique.jpg
# Embutindo a senha do fotógrafo dentro da foto sem exigir senha de extração (-p "")
RUN echo "fotografo:Sup3rS3cr3tD1n0P4ssw0rd!" > /tmp/credenciais.txt && \
    steghide embed -cf /home/estagiario_ti/backups_camera/ultimo_clique.jpg -ef /tmp/credenciais.txt -p "" && \
    rm /tmp/credenciais.txt
RUN chown -R estagiario_ti:estagiario_ti /home/estagiario_ti/backups_camera

# ---------------------------------------------------------
# ETAPA 4: CRIAÇÃO DAS FLAGS
# ---------------------------------------------------------
# User Flag
RUN echo "TAC{0ne_La5t_Fla5h_}" > /home/fotografo/user.txt && \
    chown fotografo:fotografo /home/fotografo/user.txt && \
    chmod 600 /home/fotografo/user.txt

# Root Flag
RUN echo "TAC{t_rex_is_loose_RUN}" > /root/root.txt && \
    chmod 600 /root/root.txt

# ---------------------------------------------------------
# ENTRYPOINT
# ---------------------------------------------------------
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expõe as portas do Apache e do SSH
EXPOSE 80 22

CMD ["/entrypoint.sh"]
