var mongoose = require('mongoose');

var MetricSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    label: String,
});

var ParameterSchema = new mongoose.Schema({
    name: String,
    description: String,
    label: String,
    // range to be added later.
});

var MeasurementSchema = new mongoose.Schema({
    milestone: String,
    name: String,
    value: Number,
    lastMeasured: Date,
    parameters: Object,
});


// Modifies the first measurement object to include any data that exists in the new
// measurement.
MeasurementSchema.methods.merge = function (update) {
    this.value = update.value;
    this.lastMeasured = update.lastMeasured;
};

var ProjectSchema = new mongoose.Schema({
    name: String,
    metrics: [MetricSchema],
    parameters: [ParameterSchema],
    measurements: [MeasurementSchema],
});

// Returns an object containing a mapping between metric names and a one-dimensional list
// of all values (including zeros for missing values).
ProjectSchema.methods.flatten = function () {
    var metrics = {};
    var count = {};

    // First get a count of how large each array should be. The array will be trimmed at the
    // maximum specified value.
    for (var measurement in this.measurements) {
        if (measurment.name in count) {
            count[measurement.name]++;
        } else {
            count[measurement.name] = 1;
            metrics[measurement.name] = [];
        }
    }

    for (var key in count) {
        metrics[key] = new Array(count[key]);
    }

    // TODO: actually flatten.

    return metrics;
}

// Determines whether there's a measurement that needs to be updated with the provided
// measurement. If not, return undefined.
ProjectSchema.methods.findDuplicate = function (update) {
    var found = this.measurements.find(function (existing) {
        // If they're not the same milestone and metric name then there's no chance of matching.
        if (existing.milestone !== update.milestone) return false;
        if (existing.parameters.length !== update.parameters.length) return false;
        if (existing.name !== update.name) return false;

        // A "matching" measurement will share all parameters, and will have the same
        // values for them.
        for (var i = 0; i < existing.parameters.length; i++) {
            var found = false;

            for (var j = 0; j < update.parameters.length; j++) {
                if (existing.parameters[i].name == update.parameters[j].name &&
                    existing.parameters[i].value == update.parameters[j].value) {
                    found = true;
                }
            }

            if (!found) return false;
        }

        return true;
    });

    return found;
};

var AccountSchema = new mongoose.Schema({
    name: String,
    createdOn: Date,
    links: Array,
});

var BionicRecord = new mongoose.Schema({
    account: AccountSchema,
    projects: [ProjectSchema],
}, {
    collection: 'records',
});

var models = {
    Account: mongoose.model('Account', AccountSchema),
    BionicRecord: mongoose.model('BionicRecord', BionicRecord),
    Metric: mongoose.model('Metric', MetricSchema),
    Measurement: mongoose.model('Measurement', MeasurementSchema),
    ParameterSchema: mongoose.model('Parameter', ParameterSchema),
    Project: mongoose.model('Project', ProjectSchema),
};

/**
 * Measurement model's function namespace. new() creates a new measurement from
 * a request body, and find() performs a lookup for an existing measurement.
 */
var Measurement = {
    new: function (body) {
        var defaults = {
            milestone: "<none>",
            name: "<unknown>",
            value: 0,
            lastMeasured: Date.now(),
            parameters: {},
        };

        return new models.Measurement({
            milestone: ('milestone' in body) ? body.milestone : defaults.milestone,
            name: ('name' in body) ? body.name : defaults.name,
            value: ('value' in body) ? body.value : defaults.value,
            lastMeasured: defaults.lastMeasured,
            parameters: ('parameters' in body) ? body.parameters : defaults.parameters,
        });
    },

    find: function (query, callback) {
        return models.Measurement.find(query, callback);
    },
};

var BionicRecord = {
    new: function () {
        return new models.BionicRecord({
            account: new models.Account({
                name: "anyweez",
            }),
        });
    },

    find: function (query, callback) {
        return models.BionicRecord.find(query, callback);
    },

    get: function (id, callback) {
        return models.BionicRecord.findOne().exec(callback);
    }
}

var Project = {
    new: function () {
        return new models.Project({
            name: "newsflash",
        });
    }
}

module.exports = {
    BionicRecord: BionicRecord,
    Measurement: Measurement,
    Project: Project,
};

/*
function Metric(body) {
    var defaults = {
        name: "<unknown>",
        description: "<unspecified>",
        label: "<none>",
    };

    return new models.Metric({
        name: (name in body) ? body.name : defaults.name,
        description: (description in body) ? body.description : defaults.description,
        label: (label in body) ? body.label : defaults.label,
    });
};
*/