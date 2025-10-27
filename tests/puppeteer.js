const puppeteer = require("puppeteer");
require("../app");
const { seed_db, testUserPassword, factory } = require("../util/seed_db");
const Job = require("../models/Job");

let testUser = null;

let page = null;
let browser = null;

// Launch the browser and open a new blank page
describe("jobs-ejs puppeteer test", function () {
  before(async function () {
    this.timeout(10000);
    //await sleeper(5000)
    browser = await puppeteer.launch({headless: false, slowMo: 10});
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
  });
  after(async function () {
    this.timeout(5000);
    await browser.close();
  });
  describe("got to site", function () {
    it("should have completed a connection", async function () {});
  });
  describe("index page test", function () {
    this.timeout(10000);
    it("finds the index page logon link", async () => {
      this.logonLink = await page.waitForSelector(
        "a ::-p-text(Log in)",
      );
    });
    it("gets to the logon page", async () => {
      await this.logonLink.click();
      await page.waitForNavigation();
      const email = await page.waitForSelector('input[name="email"]');
    });
  });
  describe("logon page test", function () {
    this.timeout(20000);
    it("resolves all the fields", async () => {
      this.email = await page.waitForSelector('input[name="email"]');
      this.password = await page.waitForSelector('input[name="password"]');
      this.submit = await page.waitForSelector("button ::-p-text(Logon)");
    });
    it("sends the logon", async () => {
      testUser = await seed_db();
      await this.email.type(testUser.email);
      await this.password.type(testUserPassword);
      await this.submit.click();
      await page.waitForNavigation();
      await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
      await page.waitForSelector("a ::-p-text(change the secret)");
      await page.waitForSelector('a[href="/secretWord"]');
      const copyr = await page.waitForSelector("p ::-p-text(copyright)");
      const copyrText = await copyr.evaluate((el) => el.textContent);
      console.log("copyright text: ", copyrText);
    });
  });
  //Job operations test
  describe("puppeteer job operations", function() {
    this.timeout(20000);

    it('verifies the job listings page with 20 entries', async () => {
      const { expect } = await import('chai');
      this.jobsPage = await page.waitForSelector('a[href="/jobs"]');
      await this.jobsPage.click();
      await page.waitForNavigation();
      const jobEntries = await page.content();
      expect(jobEntries.split("<tr>").length).to.equal(21);
    })

    it('resolves company field, position field, status selection, and add button', async () => {
      const newJob = await factory.build("job");
      const { expect } = await import('chai');
      this.addJobButton = await page.waitForSelector("button ::-p-text(Add Job)");
      await this.addJobButton.click();
      await page.waitForNavigation();
      await page.waitForSelector("h2 ::-p-text(Add a job)");
      this.company = await page.waitForSelector('input[name="company"]');
      this.position = await page.waitForSelector('input[name="position"]');
      this.status = await page.waitForSelector('select[name="status"]');
      this.createBtn = await page.waitForSelector("button ::-p-text(Create)");
    })

    it('adds a job', async () => {
      const newJob = await factory.build("job");
      const { expect } = await import('chai');
      await this.company.type(newJob.company);
      await this.position.type(newJob.position);
      await page.select('select[name="status"]', newJob.status);
      await this.createBtn.click();
      await page.waitForNavigation();
      await page.waitForSelector('div ::-p-text("Info: The job listing has been added!")')

      const jobEntries = await page.content();
      expect(jobEntries.split("<tr>").length).to.equal(22);

      const jobs = await Job.find({createdBy: testUser._id})
      expect(jobs.length).to.equal(21)
    })
  })
  
});
