import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "7866",
  port: "5432"
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited() {
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  countries = result.rows;
  const countryCode = countries.map(country => country.country_code);
  return countryCode;
}

app.get("/", async (req, res) => {
  const countryCode = await checkVisited();
  res.render("index.ejs", { countries: countryCode, total: countryCode.length });
});

app.post("/add", async (req, res) => {
  const value = req.body["country"];
  try{
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'", 
      [value]
    );
    if(result.rows.length !==0 ){
      const data = result.rows[0];
      const country_code = data.country_code;
      try{
        await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)", [
          country_code,
        ]);
      res.redirect("/");
      } catch(err){
        const countryCode = await checkVisited();
        res.render("index.ejs", { 
          countries: countryCode, 
          total: countryCode.length, 
          error: "Country already marked as visited", 
        });
      }
    } else{
      const countryCode = await checkVisited();
      res.render("index.ejs", { 
        countries: countryCode, 
        total: countryCode.length, 
        error: "Country does not exist, try again", 
      });
    }
  }  catch(err) {
    const countryCode = await checkVisited();
    res.render("index.ejs", { 
      countries: countryCode, 
      total: countryCode.length, 
      error: "An unexpected error occurred. Please try again", 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
