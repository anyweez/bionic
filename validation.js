/**
 * Checks that the JSON body sent to the /report endpoint contains a valid report.
 * If so, it returns a summarized object. If not, an exception should be raised.
 *
 * TODO: add a bunch of validation logic.
 */
function report(body) {
    // Example validation for a field.
    if (!('acctId' in body)) throw new Error("No acctId declared in report.");
    if (typeof body.acctId != 'string') throw new Error("Invalid acctId: must be a string");

    // Copy into a new object so that no expected / unvalidated fields will creep through.
    return {
        acctId: body.acctId,
        project: body.project,
        milestone: body.milestone,
        name: body.name,
        value: body.value,
        parameters: body.parameters,
    };
}

module.exports = {
    report: report,
};