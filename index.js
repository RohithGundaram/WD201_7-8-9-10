const app = require("./app");
const port = process.env.PORT || 3000;
// eslint-disable-next-line no-undef
app.listen(port, () => {
  console.log(`Started express server at port - ${port}`);
});
