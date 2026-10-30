#!/bin/bash
# Iniciar o serviço SSH
service ssh start
# Iniciar o Apache em foreground para manter o container vivo
httpd-foreground