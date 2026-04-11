FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 5006

CMD ["npm", "start"]
