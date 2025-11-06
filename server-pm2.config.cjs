/*
/
/ File for pm2 command config, 
/ 	- name: is related to package.json serve:dev and server:pro script, if modified, update the scripts
/
*/

module.exports = {
  apps: [
    {
      name: "zoho-backups-DEV:3008",
      script: "./dist/main.js",
      env: {
	      NODE_ENV: "dev",
        PORT: 3008
      }
    },
    {
      name: "zoho-backups-PRO:3007",
      script: "./dist/main.js",
      env: {
	      NODE_ENV: "pro",
        PORT: 3007
      }
    },
  ]
};
