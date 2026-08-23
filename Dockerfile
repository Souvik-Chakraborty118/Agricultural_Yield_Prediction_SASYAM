FROM eclipse-temurin:17-jdk-jammy

#Install Python 3.11 and venv
RUN apt-get update && apt-get install -y python3.11 python3.11-venv python3-pip

WORKDIR /app
COPY . .

#Build the Python environment
RUN python3.11 -m venv .venv
RUN .venv/bin/pip install -r requirements.txt

#Compile the Java Server
RUN mkdir -p out
RUN javac -encoding UTF-8 -d out src/main/java/com/sasyam/app/SasyamServer.java

# Pull actual LFS model files
RUN apt-get update && apt-get install -y git-lfs && git lfs install
RUN git lfs pull

#Set Environment Variables
ENV SASYAM_PORT=8080
ENV SASYAM_PYTHON=/app/.venv/bin/python
ENV SASYAM_MODEL_DIR=/app

EXPOSE 8080

#Start the server
CMD ["java", "-cp", "out", "com.sasyam.app.SasyamServer"]
