FROM node:latest

WORKDIR /

COPY package*.json ./

RUN npm install 
# RUN npm ci --only=production

COPY . .

EXPOSE 8000

CMD ["node","index.js"]