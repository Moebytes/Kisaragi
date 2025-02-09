FROM node:23

RUN apt-get update && apt-get install -y make g++ python3 ffmpeg sox \
postgresql-16 supervisor && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm install --prefer-offline --omit=dev

COPY . .
EXPOSE 4000
COPY supervisor.conf /etc/supervisor/conf.d/supervisor.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisor.conf"]