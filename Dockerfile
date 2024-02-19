FROM ubuntu:trusty

# Install dependencies
RUN apt-get update && apt-get install -y \
  curl \
  build-essential \
  cmake \
  ncdu \
  git \
  python2.7

RUN ln -s /usr/bin/python2.7 /usr/bin/python

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
  && . ~/.nvm/nvm.sh \
  && nvm install 8.0 \
  && nvm use 8.0 \
  && npm -g i node-gyp@3.7.0 n@1.3.0 

WORKDIR /root

# still have to run the following after container is started
# nvm install 8.0
