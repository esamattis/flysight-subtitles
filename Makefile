export PATH := node_modules/.bin:$(PATH)

all:
	npm install

server:
	webpack-dev-server
