import { User } from "blaise-api-node-client";
import AuthenticationApi from "./AuthenticationApi";
import { getCurrentUser } from "./user";

// define mocks
jest.mock("./user");
const getLoggedInUserMock = getCurrentUser as jest.Mock<Promise<User | null>>;
const userMockObject: User = {
  name: "Jake Bullet",
  role: "Manager",
  serverParks: ["gusty"],
  defaultServerPark: "gusty",
};

const sut = new AuthenticationApi();

describe("GetUser from Blaise", () => {
  it("Should return expected user", async () => {
    // arrange
    getLoggedInUserMock.mockImplementation(() => Promise.resolve(userMockObject));

    // act
    const user = await sut.getLoggedInUser();

    // assert
    expect(user).toEqual(userMockObject);
  });

  it("Should throw an error if getCurrentUser errors", async () => {
    // arrange
    getLoggedInUserMock.mockImplementation(() => Promise.resolve(null));

    // act 
    const user = await sut.getLoggedInUser();

    // assert
    expect(user).toEqual(null);
  });
});
