var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var models = require('./models');
var validate = require('./validation');

var app = express();
app.set('view engine', 'jade');
app.use(bodyParser.json());

// Temporary global that's populated when the Mongo connection is complete. Eventually this
// will need to be retrieved dynamically (once I need to support more than one account).
var account;

/**
 * TODO:
 *  X. Store POST'd measurements into a single account.
 *  2. Retrieve metric data and display in a table for each branch:commit.
 *  3. Send JSON payload for existing 
 */

// Temporary; sets up a schema that we can use for testing elsewhere.
app.get('/init', function (request, response) {
    var record = models.BionicRecord.new();

    record.projects.push(models.Project.new());
    record.save();

    response.sendStatus(200);
});

function prep(record) {
    var extracted = {
        account: {
            name: record.account.name,
        },
        projects: [],
    };

    // For each project, create a dataset per metric that's got a name and a one-dimensional
    // array for each dataset.
    record.projects.map(function (project) {
        extracted.projects.push({
            name: project.name,
            data: [],
            min: 0,
            max: 10,
        });
    })

    return extracted;
}

/**
 * Dashboard viewer.
 */
app.get('/', function (request, response) {
    "use strict";

    response.render('dashboard', prep(account));
});

/**
 * API endpoint that receives a JSON collection of data
 */
app.post('/report', function (request, response) {
    "use strict";

    try {
        var report = validate.report(request.body);
        // Extract the measurement from the body. This will also validate to
        // ensure that proper information is provided; if not it may raise a
        // BMeasurementError exception.
        var measurement = models.Measurement.new(report);

        // Retrieve the project.
        var project = account.projects.find(function (el) {
            return el.name == report.project;
        });

        if (project === undefined) {
            throw new Error("Project '" + report.project + "' does not exist.");
        }

        // If there's an existing measurement for this project && milestone && parameter set, we should
        // just update that one. If there's not, we should create a new one.
        var existing = project.findDuplicate(measurement);

        console.log(existing);
        if (existing !== undefined) {
            existing.merge(measurement);
            existing.save();
        } else {
            console.log("creating new record");
            project.measurements.push(measurement);
        }

        account.save();
    } catch (exception) {
        console.log(exception.stack);
        response.sendStatus(500);
        return;
    }

    response.sendStatus(200);
});

mongoose.connect('mongodb://172.30.0.101/bionic');
// Load sample account; eventually this will need to be retrieved dynamically.
mongoose.connection.on('connected', function () {
    models.BionicRecord.get("5642afbe7d7c50fa36a7acef", function (err, result) {
        account = result;
    });
});
mongoose.connection.on('error', function (err) {
    console.log("Error connecting: " + err);
});

app.listen(8080);