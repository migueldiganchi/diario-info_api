# Rest API - {JsonLink}.IO

{JsonLink}.IO Authentication API

## About the project

{JsonLink}.IO Authentication Manager

## How To Install

Having Node.js and NPM Installed:

```
npm i
```

## How To Run

Having Node.js and NPM Installed:

```
npm run start
```

### Project Structure

- **package.json** : It contains all project dependencies.
- **api.js** : Main project file, it has it initialize all the necessary files.
- **models/**: It has it's data structure of the API service.
- **controllers/**: It has the logic of the API service.
- **routes/**: It has the request handlers for each endpoint of the API service.
- **util/database.js** : MongoDB handler.

### Endpoints

- **/signup/** :
    - Method: **POST**
    - Description: Return a 201 status code showing that one user was created.

- **/signup/:token/activation** :

    - Method: **POST**
    - Description: Return a 201 status code showing that one user account was activated

- **/signin/** :

    - Method: **POST**
    - Description: Return a 201 status showing that one session was created. It gives the ui the token key to sub sequent requests

- **/signout/** :

    - Method: **DELETE**
    - Description: Removes all data related with session
