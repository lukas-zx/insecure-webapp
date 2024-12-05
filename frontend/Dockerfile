FROM node:12 # Veraltetes Base-Image
WORKDIR /app
COPY package*.json ./
RUN npm install # Unsichere Bibliotheken in package.json
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
