const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at htttp://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertStateObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT * FROM state ORDER BY state_id;`;
  const stateArray = await db.all(getStateQuery);
  response.send(
    stateArray.map((eachState) => convertStateObjectToResponseObject(eachState))
  );
});

app.post("/districts/", async (request, response) => {
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const postDistrictQuery = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},'${cases}','${active}','${deaths}','${cured}');`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state  WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertObjectToResponseObject(state));
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district  WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertObjectToResponseObject(district));
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const details = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = details;
  const updateDistrictQuery = `UPDATE district  SET district_name = '${districtName}',state_id = '${stateId}',cases = '${cases}',cured = '${cured}',active = '${active}',deaths = '${deaths}' WHERE district_id = ${districtId} ;`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id =${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDistrictStateQuery = `SELECT SUM(cases) as totalCases,SUM(cured) as totalCured, SUM(active) as totalActive, SUM(deaths) as totalDeaths FROM district  WHERE state_id = ${stateId};`;
  const stateArray = await db.get(getDistrictStateQuery);
  response.send(stateArray);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district  WHERE district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `SELECT state_name as stateName FROM state WHERE state_id = ${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
