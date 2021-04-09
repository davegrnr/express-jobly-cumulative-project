"use strict";


const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Job = require("./job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// ********************CREATE

describe("create", function () {
  const newJob = {
    title: "testJob",
    salary: 100,
    equity: "0.2",
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      ...newJob,
      id: expect.any(Number),
    });
  });
});

describe("findAll", function (){
  test("works with no filters", async () => {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[1],
        title: "Job2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[2],
        title: "Job3",
        salary: 300,
        equity: "0",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[3],
        title: "Job4",
        salary: null,
        equity: null,
        companyHandle: "c1",
        companyName: "C1",
      },
    ])
  })

  test("works with minSalary", async () => {
    let jobs = await Job.findAll({minSalary: 299});
    expect(jobs).toEqual([{
      id: testJobIds[2],
      title: "Job3",
      salary: 300,
      equity: "0",
      companyHandle: "c1",
      companyName: "C1",
    }])
  })

  test("works with equity", async () => {
    let jobs = await Job.findAll({hasEquity: true});
    expect(jobs).toEqual([{
      id: testJobIds[0],
      title: "Job1",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1",
      companyName: "C1",
    },
    {
      id: testJobIds[1],
      title: "Job2",
      salary: 200,
      equity: "0.2",
      companyHandle: "c1",
      companyName: "C1",
    }])
  })

  test("works with equity and minSalary", async () => {
    let jobs = await Job.findAll({hasEquity: true, minSalary: 199});
    expect(jobs).toEqual([{
      id: testJobIds[1],
      title: "Job2",
      salary: 200,
      equity: "0.2",
      companyHandle: "c1",
      companyName: "C1",
    }])
  })

  test("works by title", async () => {
    let jobs = await Job.findAll({title: "Job1"});
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
        companyName: "C1",
      }]);
    });
})

// ************ GET :id

describe("get", function () {
  test("works", async () => {
    let job = await Job.get(testJobIds[0]);
    expect(job).toEqual({
      id: testJobIds[0],
      title: "Job1",
      salary: 100,
      equity: "0.1",
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("not found error for invalid id", async () => {
    try{
      await Job.get(testJobIds[99]);
      fail();
    } catch(err){
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ****************UPDATE

describe("update", () => {
  let updatedJob = {
    title: "update",
    salary: 111,
    equity: "0.9"
  }
  test("works", async () => {
    let job = await Job.update(testJobIds[0], updatedJob);
    expect(job).toEqual({
      id: expect.any(Number),
      companyHandle: "c1",
      title: "update",
      salary: 111,
      equity: "0.9"
    })
  })
  test("bad request for inadequate data", async () => {
    try {
      await Job.update(testJobIds[0], {});
      fail();
    } catch (e){
      expect(e instanceof BadRequestError).toBeTruthy()
    }
  })
})

// ************REMOVE

describe("remove", () => {
  test("works", async ()=> {
    await Job.remove(testJobIds[0])
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=$1", [testJobIds[0]]);
  expect(res.rows.length).toEqual(0);
  });
})

test("not found if no such job", async function () {
  try {
    await Job.remove(0);
    fail();
  } catch (err) {
    expect(err instanceof NotFoundError).toBeTruthy();
  }
});
