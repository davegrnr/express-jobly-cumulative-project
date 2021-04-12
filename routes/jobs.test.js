"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/* ******************POST /jobs */ 

describe("POST /jobs", function() {
    const newJob = {
        title: "newJob",
        salary: 100000,
        equity: "0.2",
        companyHandle: "c1"
    };

    test("works for admin", async() => {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "newJob",
                salary: 100000,
                equity: "0.2",
                companyHandle: "c1"
            }
        });
    })

    test("unauthorized for users", async () => {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
            expect(resp.statusCode).toEqual(401);
    })

    test("bad request for missing data", async () => {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "bad"
            })
            .set("authorization", `Bearer ${adminToken}`);
            expect(resp.statusCode).toEqual(400)
    })

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post(`/jobs`)
            .send({
                companyHandle: "c1",
                title: "J-new",
                salary: "this is a string",
                equity: "0.2",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
})

// ************************ GET /jobs

describe("GET /jobs", function() {
    test("works for anon", async () => {
        const resp = await request(app).get(`/jobs`);
        expect(resp.body).toEqual({
            jobs: [{
                id: expect.any(Number),
                title: "job1", 
                companyHandle: "c1", 
                companyName: "C1",
                salary: 100, 
                equity: '0.1'
            },
            {
                id: expect.any(Number),
                title: "job2", 
                companyHandle: "c1", 
                companyName: "C1",
                salary: 200, 
                equity: '0.2'
            }]
        })
    })

    test("works with filtering", async () => {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ hasEquity: true });
        expect(resp.body).toEqual({
            jobs: [{
                id: expect.any(Number),
                title: "job1", 
                companyHandle: "c1", 
                companyName: "C1",
                salary: 100, 
                equity: '0.1'
            },
            {
                id: expect.any(Number),
                title: "job2", 
                companyHandle: "c1", 
                companyName: "C1",
                salary: 200, 
                equity: '0.2'
            }]
        })
    })
    
    test("works with 2 filters", async () => {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ minSalary: 100, title: "job2"})
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "job2", 
                    companyHandle: "c1", 
                    companyName: "C1",
                    salary: 200, 
                    equity: '0.2'
                }
            ]
        })
    })

    test("bad request with invalid filter key", async () => {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ wrong: "wrong"})
        expect(resp.statusCode).toEqual(400)
    })
})

/*********************** GET /jobs/:id */ 

describe("GET /jobs/:id", function () {
    test("works for anon", async () => {
        const resp = await request(app)
            .get(`/jobs/${testJobIds[0]}`)
        expect(resp.body).toEqual({
            job: {
                id: testJobIds[0],
                title: "job1",
                salary: 100,
                equity: "0.1",
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1,
                    logoUrl: "http://c1.img",
                },
            },
        })
    })

    test("not found err for non-existent jobs", async () => {
        const resp = await request(app).get(`/jobs/0`)
        expect(resp.statusCode).toBe(404);
    });
});

/************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async () => {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "newTitle",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "newTitle",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1"
            },
        });
    });

    test("unauth for users", async () => {
            const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "newTitle",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401)
    })

    test("not found for no such job id", async () => {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "newTitle",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404)
    })

    test("bad request for handle change attemopt", async () => {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                handle: "bad",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400)
    })

    test("bad request with invalid data", async () => {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                salary: "not-a-number",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
})

describe("DELETE /jobs/:id", function () {
    test("works for admin", async () => {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: testJobIds[0]})
    })

    test("unauth for non-admin", async () => {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401)
    })

    test("unauth for anonymous", async () => {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`);
        expect(resp.statusCode).toBe(401)
    });

    // test("404 for no such job", async () => {
    //     const resp = await request(app)
    //         .delete(`/jobs/0`)
    //         .set("authorization", `Bearer ${adminToken}`);
    //     expect(resp.statusCode).toBe(404)
    // });
});