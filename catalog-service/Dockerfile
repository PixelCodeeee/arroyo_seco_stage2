FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN DATABASE_URL="mysql://root:password@localhost:3306/arroyo_seco" npx prisma generate
EXPOSE 5002
CMD ["npm", "start"]
