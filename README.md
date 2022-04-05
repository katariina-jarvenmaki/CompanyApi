# CompanyApi
Backend application that polls information from Business Information System YTJ Open Data API (PRH)

TO USE:
* Install nodejs, npm & docker (on Ubuntu/Debian):
  sudo apt install nodejs npm docker.io

1. Download api-folder
2. Open api-folder in terminal (Visual Studio)
3. npm install 
4. npm start
5. App is now running, example: localhost:8000/api/company/2532004-3
6. sudo docker build -t companyapi .
7. sudo docker run -p 3000:8000 companyapi
8. App is now running, example: localhost:3000/api/company/2532004-3

Tested with Ubuntu 20.04, nodejs 10.19, npm 6.14.4 & docker 20.10.7
