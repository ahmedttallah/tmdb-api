# TMDB NestJS API

This is a backend RESTful API built with NestJS, TypeORM, PostgreSQL, and Redis caching.  
It supports user authentication (JWT), movie data querying with filters, user ratings, favorites, and more.

---

## Features

- User signup and login with JWT authentication
- Movie search and filtering (by title, genre, language, year, rating, popularity, adult flag)
- Movie ratings (rate, update, get average rating)
- User favorites management
- Redis caching for improved performance
- Swagger API documentation

---

## Tech Stack

- Node.js 20 (Alpine)
- NestJS framework
- TypeORM (PostgreSQL)
- Redis for caching
- Docker & Docker Compose

---

## Prerequisites

- Docker and Docker Compose installed on your machine

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-repo-folder>
````

### 2. Environment variables

The project includes an `.env.example` file with the required environment variables.
When building the Docker image, this is copied to `.env` automatically.
You can customize `.env` if needed.

### 3. Build and run with Docker Compose

```bash
docker-compose up --build
```

This will start:

* The NestJS API server on port `8080`
* PostgreSQL database on port `5432`
* Redis server on port `6379`

---

## Usage

* The API will be accessible at: `http://localhost:8080`
* Swagger API documentation is available at:
  `http://localhost:8080/api-docs`

---

## Development

If you want to run the app locally (without Docker), make sure you have:

* Node.js 20 installed
* PostgreSQL and Redis running locally or remotely
* Proper `.env` configuration

Then:

```bash
yarn install
yarn build
yarn start:dev
```

---

## Project Structure

* `/src` - Source code
* `/src/modules` - Feature modules (auth, users, movies, ratings, favorites, etc.)
* `/src/shared` - Shared interfaces, utilities
* `/src/main.ts` - Entry point

---

## Notes

* The app uses TypeORM caching with Redis.
* JWT authentication protects routes like user profile, rating, and favorites.
* The Swagger docs provide request/response examples and authentication mechanism.
