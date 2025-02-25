FROM node:18.20.7

WORKDIR /app

COPY package*.json ./

RUN npm install -save-dev nodemon

COPY . .

EXPOSE 8000

CMD ["npm", "run", "dev"]