FROM node:20-alpine
USER root

USER 1000
WORKDIR /usr/src/app
# Copy package.json and package-lock.json to the container
COPY --chown=1000 package.json package-lock.json ./

# Copy the rest of the application files to the container
COPY --chown=1000 . .

RUN npm install
RUN npm run build

# Expose the application port (assuming your app runs on port 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]