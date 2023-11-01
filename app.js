//Import Statements

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");

//Utilities
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

//Database Initialization
let db = null;
const dbPath = path.join(__dirname, "busApplication.db");
const initializeAndSetUpDatabase = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3020, () =>
            console.log("Local Host Server started at port 3020")
        );
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

initializeAndSetUpDatabase();

//Authentication(middleware) using JWT token
const authenticationToken = (req, res, next) => {
    let jwtToken;
    const authHeader = req.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
        res.status(401);
        res.send("Invalid JWT Token");
    } else {
        jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
            if (error) {
                res.status(401);
                res.send("Invalid JWT Token");
            } else {
                req.user_name = payload.user_name;
                next();
            }
        });
    }
};

//User Login API
app.post("/login/", async (req, res) => {
    const { user_name, password } = req.body;
    const selectQuery = `
    SELECT * FROM user WHERE user_name='${user_name}';
    `;
    const dbUser = await db.get(selectQuery);
    console.log(dbUser);
    if (dbUser === undefined) {
        res.status(400);
        res.send("Invalid user");
    } else {
        const payload = {
            user_name: user_name,
        };
        const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
        res.setHeader("Content-Type", "application/json");
        res.send({ jwtToken, dbUser });
    }
});

//Driver Login API
app.post("/driver/login/", async (req, res) => {
    const { user_name, password } = req.body;
    const selectQuery = `
    SELECT * FROM driver WHERE username='${user_name}';
    `;
    const dbUser = await db.get(selectQuery);
    console.log(dbUser);
    if (dbUser === undefined) {
        res.status(400);
        res.send("Invalid user");
    } else {
        const payload = {
            username: user_name,
        };
        const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
        res.setHeader("Content-Type", "application/json");
        res.send({ jwtToken, dbUser });
    }
});


//Get Specific User
app.get("/user/:user_id", authenticationToken, async (req, res) => {
    const { user_id } = req.params;

    const getQuery = `
       select * from USER where user_id=${user_id}
    `;

    const result = await db.get(getQuery);
    const obj = { susses: true, data: result };

    res.send(obj);
});

//Get all users
app.get("/users/", authenticationToken, async (req, res) => {
    const getQuery = `
       select * from user
    `;

    const result = await db.all(getQuery);
    const obj = { susses: true, data: result };

    res.send(obj);
});

//Add new user
app.post("/users/", async (request, response) => {
    const {
        username,
        password,
        phone_number,
        email_id,
        organization_id,
        default_bus_id,
        my_stop,
    } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE user_name = '${user_name}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
      INSERT INTO 
        user (username, password, phone_number,email_id,organization_id,default_bus_id,my_stop) 
      VALUES 
        (
          '${username}', 
          '${password}',
          '${phone_number}', 
          '${email_id}',
          '${organization_id}',
          '${default_bus_id}',
          '${my_stop}'
        )`;
        const dbResponse = await db.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        response.send(`Created new user with ${newUserId}`);
    } else {
        response.status = 400;
        response.send("User already exists");
    }
});

//Update user details
app.put(
    "/users/:user_id/phone_number",
    authenticationToken,
    async (req, res) => {
        const { user_id } = req.params; // Extract user_id from request parameters
        const { phone_number } = req.body;

        try {
            // Check if the user exists
            const selectUserQuery = `SELECT * FROM user WHERE user_id = ?`;
            const dbUser = await db.get(selectUserQuery, [user_id]);

            if (!dbUser) {
                res.status(400).send("User doesn't exist");
            } else {
                // Update the phone number
                const updateUserQuery = `UPDATE user SET phone_number = ? WHERE user_id = ?`;
                await db.run(updateUserQuery, [phone_number, user_id]);

                res.send(`Phone number updated`);
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

app.put("/users/:user_id/email_id", authenticationToken, async (req, res) => {
    const { user_id } = req.params; // Extract user_id from request parameters
    const { email_id } = req.body;

    try {
        // Check if the user exists
        const selectUserQuery = `SELECT * FROM user WHERE user_id = ?`;
        const dbUser = await db.get(selectUserQuery, [user_id]);

        if (!dbUser) {
            res.status(400).send("User doesn't exist");
        } else {
            // Update the email_id
            const updateUserQuery = `UPDATE user SET email_id = ? WHERE user_id = ?`;
            await db.run(updateUserQuery, [email_id, user_id]);

            res.send(`Email ID updated`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//Update default bus ID
app.put(
    "/users/:user_id/default_bus_id",
    authenticationToken,
    async (req, res) => {
        const { user_id } = req.params; // Extract user_id from request parameters
        const { default_bus_id } = req.body;

        try {
            // Check if the user exists
            const selectUserQuery = `SELECT * FROM user WHERE user_id = ?`;
            const dbUser = await db.get(selectUserQuery, [user_id]);

            if (!dbUser) {
                res.status(400).send("User doesn't exist");
            } else {
                // Update the email_id
                const updateUserQuery = `UPDATE user SET email_id = ? WHERE user_id = ?`;
                await db.run(updateUserQuery, [default_bus_id, user_id]);

                res.send(`Bus ID updated`);
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

//Update My_Stop
app.put("/users/:user_id/my_stop", authenticationToken, async (req, res) => {
    const { user_id } = req.params; // Extract user_id from request parameters
    const { my_stop } = req.body;

    try {
        // Check if the user exists
        const selectUserQuery = `SELECT * FROM user WHERE user_id = ?`;
        const dbUser = await db.get(selectUserQuery, [user_id]);

        if (!dbUser) {
            res.status(400).send("User doesn't exist");
        } else {
            // Update the email_id
            const updateUserQuery = `UPDATE user SET email_id = ? WHERE user_id = ?`;
            await db.run(updateUserQuery, [default_bus_id, my_stop]);

            res.send(`Stop details updated`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete User
app.delete("/users/:user_id", authenticationToken, async (req, res) => {
    const { user_id } = req.params;

    try {
        // Check if the user exists
        const selectUserQuery = `SELECT * FROM user WHERE user_id = ?`;
        const dbUser = await db.get(selectUserQuery, [user_id]);

        if (!dbUser) {
            res.status(404).send("User not found");
        } else {
            // Delete the user
            const deleteUserQuery = `DELETE FROM user WHERE user_id = ?`;
            await db.run(deleteUserQuery, [user_id]);

            res.send(`User with ID ${user_id} deleted`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//Get Specific driver details
app.get("/driver/:driver_id", authenticationToken, async (req, res) => {
    const { driver_id } = req.params;

    const getQuery = `
       select * from driver where driver_id=${driver_id}
    `;

    const result = await db.get(getQuery);
    const obj = { susses: true, data: result };

    res.send(obj);
});

//Get drivers list
app.get("/drivers/", authenticationToken, async (req, res) => {
    const getQuery = `
       select * from driver
    `;

    const result = await db.all(getQuery);
    const obj = { susses: true, data: result };

    res.send(obj);
});

//Add new driver
app.post("/driver/", async (request, response) => {
    const { driver_name, phone_number, location, bus_id } = request.body;
    const selectUserQuery = `SELECT * FROM driver WHERE driver_name = '${driver_name}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
      INSERT INTO 
       driver (driver_name,phone_number,location,bus_id) 
      VALUES 
        (
          '${driver_name}', 
          '${phone_number}',
          '${location}', 
          '${bus_id}'
        )`;
        const dbResponse = await db.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        response.send(`Created new user with ${newUserId}`);
    } else {
        response.status = 400;
        response.send(
            "User already exists, if you want to update driver details click on update"
        );
    }
});

//Update driver phone number
app.put(
    "/users/:user_id/phone_number",
    authenticationToken,
    async (req, res) => {
        const { driver_id } = req.params; // Extract user_id from request parameters
        const { phone_number } = req.body;

        try {
            // Check if the user exists
            const selectUserQuery = `SELECT * FROM driver WHERE driver_id = ?`;
            const dbUser = await db.get(selectUserQuery, [driver_id]);

            if (!dbUser) {
                res.status(400).send("User doesn't exist");
            } else {
                // Update the phone number
                const updateUserQuery = `UPDATE driver SET phone_number = ? WHERE driver_id = ?`;
                await db.run(updateUserQuery, [phone_number, driver_id]);

                res.send(`Phone number updated`);
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    }
);

//Update driver location
app.put("/users/:user_id/location", authenticationToken, async (req, res) => {
    const { driver_id } = req.params; // Extract user_id from request parameters
    const { phone_number } = req.body;

    try {
        // Check if the user exists
        const selectUserQuery = `SELECT * FROM driver WHERE driver_id = ?`;
        const dbUser = await db.get(selectUserQuery, [driver_id]);

        if (!dbUser) {
            res.status(400).send("Driver doesn't exist");
        } else {
            // Update the phone number
            const updateUserQuery = `UPDATE driver SET location = ? WHERE driver_id = ?`;
            await db.run(updateUserQuery, [location, driver_id]);

            res.send(`Location is updated`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete Driver
app.delete("/drivers/:driver_id", authenticationToken, async (req, res) => {
    const { driver_id } = req.params;

    try {
        // Check if the driver exists
        const selectDriverQuery = `SELECT * FROM driver WHERE driver_id = ?`;
        const dbDriver = await db.get(selectDriverQuery, [driver_id]);

        if (!dbDriver) {
            res.status(404).send("Driver not found");
        } else {
            // Delete the driver
            const deleteDriverQuery = `DELETE FROM driver WHERE driver_id = ?`;
            await db.run(deleteDriverQuery, [driver_id]);

            res.send(`Driver with ID ${driver_id} deleted`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//Get Specific Bus details
app.get("/bus/:bus_id", authenticationToken, async (req, res) => {
    const { bus_id } = req.params;

    const getQuery = `
       select * from bus where bus_id=${bus_id}
    `;

    const result = await db.get(getQuery);
    const obj = { susses: true, data: result };

    res.send(obj);
});

//Get Buses list
app.get("/buses/", authenticationToken, async (req, res) => {
    const getQuery = `
       select * from bus
    `;

    const result = await db.all(getQuery);
    const obj = { susses: true, data: result };

    res.send(obj);
});

//Add new Bus
app.post("/bus/", async (request, response) => {
    const { bus_number, number_plate } = request.body;
    const selectUserQuery = `SELECT * FROM driver WHERE bus_number = '${bus_number}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
      INSERT INTO 
       bus (bus_number,number_plate) 
      VALUES 
        (
          '${bus_number}', 
          '${number_plate}',
        )`;
        const dbResponse = await db.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        response.send(`Created new user with ${newUserId}`);
    } else {
        response.status = 400;
        response.send(
            "User already exists, if you want to update driver details click on update"
        );
    }
});

//Update bus number
app.put("/bus/:bus_id/bus_number", authenticationToken, async (req, res) => {
    const { bus_id } = req.params; // Extract user_id from request parameters
    const { bus_number } = req.body;

    try {
        // Check if the user exists
        const selectUserQuery = `SELECT * FROM bus WHERE bus_id = ?`;
        const dbUser = await db.get(selectUserQuery, [bus_id]);

        if (!dbUser) {
            res.status(400).send("User doesn't exist");
        } else {
            // Update the phone number
            const updateUserQuery = `UPDATE bus SET bus_number = ? WHERE bus_id = ?`;
            await db.run(updateUserQuery, [bus_number, bus_id]);

            res.send(`Bus number updated`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete Bus
app.delete("/buses/:bus_id", authenticationToken, async (req, res) => {
    const { bus_id } = req.params;

    try {
        // Check if the bus exists
        const selectBusQuery = `SELECT * FROM bus WHERE bus_id = ?`;
        const dbBus = await db.get(selectBusQuery, [bus_id]);

        if (!dbBus) {
            res.status(404).send("Bus not found");
        } else {
            // Delete the bus
            const deleteBusQuery = `DELETE FROM bus WHERE bus_id = ?`;
            await db.run(deleteBusQuery, [bus_id]);

            res.send(`Bus with ID ${bus_id} deleted`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

//Get Bus Stop Co-ordinates and Bus Stop Name using bus route
app.get("/busStops/:route_number", authenticationToken, async (req, res) => {
    const { route_number } = req.params;
    const getQuery = `select Coordinates, stop_name from bus_stops where route_number=${route_number}`;

    const result = await db.all(getQuery);
    const obj = result;

    res.send(obj);
});

// Get driver_id w.r.t bus_id
app.get("/driver/busId/:bus_id", authenticationToken, async (req, res) => {
    const { bus_id } = req.params;
    const getQuery = `select driver_id from bus where bus_id=${bus_id}`;

    const result = await db.get(getQuery);
    const obj = result;

    res.send(obj);
});
// const nodemailer = require("nodemailer");

// // Create a transporter for sending emails (you need to configure this)
// const transporter = nodemailer.createTransport({
//   service: "YourEmailService",
//   auth: {
//     user: "your_email@example.com",
//     pass: "your_email_password",
//   },
// });

// // Send an email notification
// app.post("/send-notification", authenticationToken, async (req, res) => {
//   const { recipientEmail, subject, message } = req.body;

//   try {
//     // Send the email
//     await transporter.sendMail({
//       from: "your_email@example.com",
//       to: recipientEmail,
//       subject: subject,
//       text: message,
//     });

//     res.send("Notification sent successfully");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Failed to send notification");
//   }
// });

module.exports = app;
