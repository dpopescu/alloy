import { t, ClientFunction } from "testcafe";
import createNetworkLogger from "../../../helpers/networkLogger";
import { responseStatus } from "../../../helpers/assertions/index";
import createFixture from "../../../helpers/createFixture";
import configureAlloyInstance from "../../../helpers/configureAlloyInstance";
import createResponse from "../../../../../src/core/createResponse";
import getResponseBody from "../../../helpers/networkLogger/getResponseBody";
import cookies from "../../../helpers/cookies";
import {
  compose,
  orgMainConfigMain,
  consentPending,
  debugEnabled
} from "../../../helpers/constants/configParts";
import { MAIN_CONSENT_COOKIE_NAME } from "../../../helpers/constants/cookies";

const config = compose(
  orgMainConfigMain,
  consentPending,
  debugEnabled
);

const {
  IAB_NO_PURPOSE_ONE_NO_GRPR
} = require("../../../helpers/constants/consent");

const networkLogger = createNetworkLogger();

createFixture({
  title: "C224674: Opt out to IAB while gdprApplies is FALSE.",
  requestHooks: [
    networkLogger.setConsentEndpointLogs,
    networkLogger.edgeEndpointLogs
  ]
});

test.meta({
  ID: "C224674",
  SEVERITY: "P0",
  TEST_RUN: "REGRESSION"
});

const triggerSetConsent = ClientFunction(
  () => window.alloy("setConsent", IAB_NO_PURPOSE_ONE_NO_GRPR),
  { dependencies: { IAB_NO_PURPOSE_ONE_NO_GRPR } }
);

const sendEvent = ClientFunction(() => window.alloy("sendEvent"));

test("Test C224674: Opt out to IAB while gdprApplies is FALSE", async () => {
  await configureAlloyInstance("alloy", config);
  await triggerSetConsent();

  await t.expect(networkLogger.setConsentEndpointLogs.requests.length).eql(1);
  await responseStatus(networkLogger.edgeEndpointLogs.requests, 200);

  const consentRawResponse = JSON.parse(
    getResponseBody(networkLogger.setConsentEndpointLogs.requests[0])
  );

  const consentResponse = createResponse(consentRawResponse);

  // 1. The set-consent response should contain the Consent cookie: { general: in }
  const consentCookieValue = await cookies.get(MAIN_CONSENT_COOKIE_NAME);

  await t.expect(consentCookieValue).ok("No consent cookie found.");
  await t.expect(consentCookieValue).eql("general=in");

  // 2. The ECID should exist in the response payload as well, if queried
  const identityHandle = consentResponse.getPayloadsByType("identity:result");
  await t.expect(identityHandle.length).eql(2);

  await sendEvent();
  await t.expect(networkLogger.edgeEndpointLogs.requests.length).eql(1);
});
