import assert from "node:assert/strict";
import test from "node:test";

import {
  runAllSyntheticVerticalFlows,
  syntheticVerticalFlowDefinitions
} from "../src/index.ts";

test("runs Life, Work and Skills through Identity -> Intake -> Clarification -> Ready for Match", () => {
  const flows = runAllSyntheticVerticalFlows(new Date("2026-06-26T08:00:00.000Z"));

  assert.equal(flows.length, 3);
  assert.deepEqual(
    flows.map((flow) => flow.direction),
    ["life", "work", "skills"]
  );

  for (const flow of flows) {
    const definition = syntheticVerticalFlowDefinitions.find((item) => item.id === flow.id);

    assert.ok(definition, `${flow.id}: expected fixture definition`);
    assert.equal(flow.identityRef.issuer, "cifedra-local");
    assert.equal(flow.userProfile.ownerIdentityRef.id, flow.identityRef.id);
    assert.equal(flow.initialNeed.ownerUserProfileId, flow.userProfile.id);
    assert.equal(flow.initialNeed.status, "needs_clarification");
    assert.deepEqual(flow.initialNeed.completeness.missingFieldIds, [
      definition.clarification.fieldId
    ]);
    assert.deepEqual(flow.initialNeed.completeness.invalidFieldIds, []);
    assert.equal(flow.clarification.status, "resolved");
    assert.equal(flow.clarification.target.fieldId, definition.clarification.fieldId);
    assert.equal(flow.clarification.answerHistory.length, 1);
    assert.equal(flow.answeredNeed.status, "ready_for_match");
    assert.equal(flow.answeredNeed.completeness.complete, true);
    assert.equal(flow.matches[0]?.profile.id, flow.expectedProfileId);
    assert.equal(flow.candidateDecisions[0]?.decision, "requested_contact");
    assert.equal(flow.contactRequest?.status, "requested");
    assert.equal(flow.contactRequest?.needId, flow.answeredNeed.id);
    assert.equal(flow.contactRequest?.decisionId, flow.candidateDecisions[0]?.id);
    assert.equal(flow.contactRequest?.providerProfileId, flow.expectedProfileId);
    assert.equal(flow.contactRequest?.clientUserProfileId, flow.userProfile.id);
    assert.equal(flow.acceptedContactRequest?.status, "accepted");
    assert.equal(flow.acceptedContactRequest?.id, flow.contactRequest?.id);
    assert.equal(flow.engagement?.status, "planned");
    assert.equal(flow.engagement?.contactRequestId, flow.contactRequest?.id);
    assert.equal(flow.engagement?.clientUserProfileId, flow.userProfile.id);
    assert.equal(flow.engagement?.providerProfileId, flow.expectedProfileId);
    assert.equal(
      Object.hasOwn(
        flow.contactRequest?.disclosureSnapshot.publicBrief.serviceRegion ?? {},
        "latitude"
      ),
      false
    );
    assert.equal(flow.metrics.firstMatchProfileId, flow.expectedProfileId);
    assert.equal(flow.metrics.readyForMatch, true);
    assert.equal(flow.metrics.firstMatchAction, "request_contact");
    assert.equal(flow.metrics.firstDecision, "requested_contact");
    assert.equal(flow.metrics.contactRequestStatus, "requested");
    assert.equal(flow.metrics.acceptedContactRequestStatus, "accepted");
    assert.equal(flow.metrics.engagementStatus, "planned");
    assert.ok((flow.metrics.disclosureHiddenFieldCount ?? 0) > 0);
  }
});
