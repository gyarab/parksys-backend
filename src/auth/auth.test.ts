import {
  hasPermissions,
  checkAuthenticationHeader
} from "./auth";
import { Permission } from "../types/permissions";
import { createToken } from "./jwt";
import config from "../config";

const checkAuthenticationHeaderCases = [
  [
    `Bearer ${createToken(config.get("cryptSecret"), {
      a: 123,
      b: { c: 456 }
    })}`,
    { a: 123, b: { c: 456 } }
  ],
  ["Bearer abcd", null],
  [
    `What ${createToken(config.get("cryptSecret"), { a: 123, b: { c: 456 } })}`,
    null
  ],
  [null, null]
];

describe("checkAuthenticationHeader", () => {
  it("should return correct results", () => {
    checkAuthenticationHeaderCases.forEach(([authHeader, expectedResult]) => {
      expect(
        checkAuthenticationHeader({
          headers: {
            authentication: authHeader
          }
        })
      ).toStrictEqual(expectedResult);
    });
  });
});

const hasPermissionsCases: [Permission[], string[], boolean][] = [
  [[], [Permission.ALL], true],
  [[Permission.DEVICES], [Permission.ALL], true],
  [[Permission.ALL], [Permission.DEVICES], false],
  [[Permission.DEVICES, Permission.DEVICES], [Permission.DEVICES], true]
];

describe("hasPermissions", () => {
  it("should return correct results", () => {
    hasPermissionsCases.forEach(([required, supplied, expectedResult]) => {
      expect(hasPermissions(required, supplied)).toBe(expectedResult);
    });
  });
});

// TODO: Test the rest of the permission checkers that use hasPermissions
