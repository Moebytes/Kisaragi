FROM node:23

RUN apt-get update && apt-get install -y make g++ python3 ffmpeg sox
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN npm install --omit=dev

CMD ["npm", "start"]