# Author: Edilson Mucanze

# FROM centos:latest
FROM centos:latest

# eZetsu
LABEL MAINTAINER="Edilson Mucanze"

ARG SSH_USER="lab-user"
ARG SSH_PASSWORD="password"
ARG RootPassword="password"

RUN useradd "$SSH_USER"
RUN useradd sudo


RUN sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-Linux-* && \
    sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-Linux-*
RUN yum update -y
RUN yum install -y sudo && yum install ncurses -y && yum install openssl -y
RUN yum install openssl-devel -y
RUN yum install httpd -y && \
    yum install openssh-server -y && \
    yum install openssh-clients -y && \
    yum install passwd -y && \
    yum clean packages && \
    # systemctl start --now httpd && \
    echo "root:${RootPassword}" | chpasswd && \
    echo "${SSH_USER}:${SSH_PASSWORD}" | chpasswd && \
    echo "${SSH_USER} ALL=(ALL)       ALL" >> /etc/sudoers

RUN sed -i /etc/sudoers -re 's/^%sudo.*/%sudo ALL=(ALL:ALL) NOPASSWD: ALL/g' && \
    sed -i /etc/sudoers -re 's/^root.*/root ALL=(ALL:ALL) NOPASSWD: ALL/g'

EXPOSE 80
EXPOSE 82
EXPOSE 22
EXPOSE 2222
CMD ["/usr/sbin/init"]
