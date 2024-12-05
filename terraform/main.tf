terraform {
  backend "local" {
    path = "./terraform.tfstate"
  }
  required_providers {
    docker = {
      source = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {
  # host = "unix:///var/run/docker.sock" # Für Linux/Mac
  host = "npipe:////./pipe/docker_engine" # Für Windows
}

resource "docker_network" "insecure_network" {
  name = "insecure_network"
}

resource "docker_image" "db" {
  name         = "postgres:16"
  keep_locally = true
}

resource "docker_container" "db" {
  image = docker_image.db.name
  name  = "db"
  networks_advanced {
    name = docker_network.insecure_network.name
  }
  ports {
    internal = 5432
    external = 5432
  }
  env = [
    "POSTGRES_USER=admin",
    "POSTGRES_PASSWORD=secret",
    "POSTGRES_DB=mydb"
  ]
}

resource "docker_image" "frontend" {
  name         = "my-frontend-image"
  keep_locally = true
  build {
    context = "${path.module}/../frontend/"
  }
}

resource "docker_container" "frontend" {
  image = docker_image.frontend.name
  name  = "frontend"
  networks_advanced {
    name = docker_network.insecure_network.name
  }
  ports {
    internal = 3000
    external = 3000
  }
}

resource "docker_image" "auth" {
  name         = "my-auth-service"
  keep_locally = true
  build {
    context = "${path.module}/../auth/"
  }
}

resource "docker_container" "auth" {
  image = docker_image.auth.name
  name  = "auth"
  networks_advanced {
    name = docker_network.insecure_network.name
  }
  ports {
    internal = 4000
    external = 4000
  }
  depends_on = [docker_container.db]
}
