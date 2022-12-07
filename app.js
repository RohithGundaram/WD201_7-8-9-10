const express = require("express");
const app = express();
var csrf = require("tiny-csrf");
//importing cookie-parser
var cookieParser = require("cookie-parser");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");

const bcrypt = require("bcrypt");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStratergy = require("passport-local");

const saltRounds = 10;

//setting up views
app.set("views", path.join(__dirname, "views"));
app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("Some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-2837428907583420",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStratergy(
    {
      usernameField: "emails",
      passwordField: "passwords",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Password is invalid!!!" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "EmailID is invalid" });
        });
    }
  )
);

passport.serializeUser((user1, done) => {
  console.log("Serialize use in session", user1.id);
  done(null, user1.id);
});

passport.deserializeUser((id1, done) => {
  User.findByPk(id1)
    .then((user) => {
      done(null, user);
    })
    .catch((error11) => {
      done(error11, null);
    });
});

//setting up engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async function (request, response) {
  response.render("index", {
    title: "My Todo Manager",
    csrfToken: request.csrfToken(),
  });
});

app.get("/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const loggedIn = request.user.id;
      const overDue = await Todo.overDue(loggedIn);
      const dueToday = await Todo.dueToday(loggedIn);
      const dueLater = await Todo.dueLater(loggedIn);
      const completedItems = await Todo.completedItemsAre(loggedIn);
      if (request.accepts("html")) {
        response.render("todos", {
          title: "To-Do Manager",
          overDue,
          dueToday,
          dueLater,
          completedItems,
          csrfToken: request.csrfToken(),
        });
      } else {
        response.json({
          overDue,dueToday,dueLater,completedItems,
        });
      }
    } catch (err11111) {
      console.log(err11111);
      return response.status(422).json(err11111);
    }
  }
);


app.post("/users", async (request1, response) => {
  if (!request1.body.firstName) {
    request1.flash("error", "First name");
    return response.redirect("/signup");
  }
  if (!request1.body.email) {
    request1.flash("error", "Email ID");
    return response.redirect("/signup");
  }
  if (!request1.body.password) {
    request1.flash("error", "Password");
    return response.redirect("/signup");
  }
  if (request1.body.password < 8) {
    request1.flash("error", "password should be minimum 8 charatcters");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request1.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: request1.body.firstName,
      lastName: request1.body.lastName,
      email: request1.body.email,
      password: hashedPwd,
    });
    request1.login(user, (err11) => {
      if (err11) {
        console.log(err11);
        response.redirect("/");
      } else {
        response.redirect("/todos");
      }
    });
  } catch (errori2) {
    request1.flash("error", errori2.message);
    return response.redirect("/signup");
  }
});

//Route for login
app.get("/login", (request, response) => {
  response.render("login", {
    title: "Login",
    csrfToken: request.csrfToken(),
  });
});

//Route for signup
app.get("/signup", (requests, response) => {
  response.render("signup", {
    title: "Sign up",
    csrfToken: requests.csrfToken(),
  });
});

//Route for session
app.post("/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/todos");
  }
);

//Route for signout
app.get("/signout", (req, res, next) => {
  req.logout((err1) => {
    if (err1) {
      return next(err1);
    }
    res.redirect("/");
  });
});

//Not required for this level
app.get("/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo1 = await Todo.findByPk(request.params.id);
      return response.json(todo1);
    } catch (error2) {
      console.log(error2);
      return response.status(422).json(error2);
    }
  }
);

//Route for todos
app.post("/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    if (request.body.title.length < 5) {
      request.flash("error", "Lenght of title should be minimum 5");
      return response.redirect("/todos");
    }
    if (!request.body.dueDate) {
      request.flash("error", "Please select a due date");
      return response.redirect("/todos");
    }
    try {
      await Todo.addaTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userID: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error1) {
      console.log(error1);
      return response.status(422).json(error1);
    }
  }
);

//Route for completion status
app.put("/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodoIs = await todo.setCompletionStatusAs(
        request.body.completed
      );
      return response.json(updatedTodoIs);
    } catch (error1) {
      console.log(error1);
      return response.status(422).json(error1);
    }
  }
);

//Route for deleting
app.delete("/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (req, resp) {
    console.log("Delete todo with an id : ", req.params.id);
    // FILL IN YOUR CODE HERE
    try {
      const res = await Todo.remove(req.params.id, req.user.id);
      return res.json({ success: res === 1 });
    } catch (error1) {
      console.log(error1);
      return resp.status(422).json(error1);
    }
  }
);

module.exports = app;
