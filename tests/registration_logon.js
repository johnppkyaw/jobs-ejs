const { app } = require("../app");
const { factory, seed_db } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../util/get_chai");

const User = require("../models/User");

describe("tests for registration and logon", function () {
  // after(() => {
  //   server.close();
  // });

  //registration part
  it("should get the registration page", async () => {
    const { expect, request } = await get_chai();
    const req = request.execute(app).get("/sessions/register").send();
    const res = await req;
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Enter your name");
    const textNoLineEnd = res.text.replaceAll("\n", "");
    const csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
    expect(csrfToken).to.not.be.null;
    this.csrfToken = csrfToken[1];
    expect(res).to.have.property("headers");
    expect(res.headers).to.have.property("set-cookie");
    const cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) =>
      element.startsWith("__Host-csrfToken"),
    );
    expect(this.csrfCookie).to.not.be.undefined;
  });

  it("should register the user", async () => {
    const { expect, request } = await get_chai();
    this.password = faker.internet.password();
    this.user = await factory.build("user", { password: this.password });
    const dataToPost = {
      name: this.user.name,
      email: this.user.email,
      password: this.password,
      password1: this.password,
      _csrf: this.csrfToken,
    };
    const req = request
      .execute(app)
      .post("/sessions/register")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .send(dataToPost);
    const res = await req;
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include("Jobs List");
    newUser = await User.findOne({ email: this.user.email });
    expect(newUser).to.not.be.null;
  });

  //logon part
  it("should log the user on", async () => {
    const dataToPost = {
      email: this.user.email,
      password: this.password,
      _csrf: this.csrfToken,
    };
    const { expect, request } = await get_chai();
    const req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", this.csrfCookie)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(0)
      .send(dataToPost);
    const res = await req;
    expect(res).to.have.status(302);
    expect(res.headers.location).to.equal("/");
    const cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) =>
      element.startsWith("connect.sid"),
    );
    expect(this.sessionCookie).to.not.be.undefined;
  });

  it("should get the index page", async () => {
    const { expect, request } = await get_chai();
    const req = request
      .execute(app)
      .get("/")
      .set("Cookie", this.csrfCookie)
      .set("Cookie", this.sessionCookie)
      .send();
    const res = await req;
    expect(res).to.have.status(200);
    expect(res).to.have.property("text");
    expect(res.text).to.include(this.user.name);
  });
});
