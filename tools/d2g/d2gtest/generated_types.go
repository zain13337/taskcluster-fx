// This source code file is AUTO-GENERATED by github.com/taskcluster/jsonschema2go

package d2gtest

import (
	"encoding/json"
)

type (
	// Configuration options for the d2g translation
	D2GConfiguration struct {

		// Default:    true
		AllowChainOfTrust bool `json:"allowChainOfTrust" default:"true"`

		// Default:    true
		AllowDisableSeccomp bool `json:"allowDisableSeccomp" default:"true"`

		// Default:    true
		AllowHostSharedMemory bool `json:"allowHostSharedMemory" default:"true"`

		// Default:    true
		AllowInteractive bool `json:"allowInteractive" default:"true"`

		// Default:    true
		AllowKVM bool `json:"allowKVM" default:"true"`

		// Default:    true
		AllowLoopbackAudio bool `json:"allowLoopbackAudio" default:"true"`

		// Default:    true
		AllowLoopbackVideo bool `json:"allowLoopbackVideo" default:"true"`

		// Default:    true
		AllowPrivileged bool `json:"allowPrivileged" default:"true"`

		// Default:    true
		AllowPtrace bool `json:"allowPtrace" default:"true"`

		// Default:    true
		AllowTaskclusterProxy bool `json:"allowTaskclusterProxy" default:"true"`

		// Possible values:
		//   * "docker"
		//   * "podman"
		//
		// Default:    "docker"
		ContainerEngine string `json:"containerEngine" default:"docker"`
	}

	// Static d2g input/output test cases. Contains pairs of Docker Worker task def/payload
	// (inputs) and Generic Worker expected task def/payload (outputs).
	D2GTestCases struct {

		// A suite of tests for a particular d2g feature or set of features
		TestSuite TestSuite `json:"testSuite"`
	}

	// A test case contains a static input Docker Worker task definition, and an
	// expected Generic Worker task definition output. The Docker Worker task definition
	// is converted by d2g to a Generic Worker task definition. The test is successful
	// if the generated Generic Worker task definition exactly matches the Generic
	// Worker task definition in the test case.
	TaskDefinitionTestCase struct {

		// Configuration options for the d2g translation
		D2GConfig D2GConfiguration `json:"d2gConfig"`

		// Detailed information about what the test case tests
		Description string `json:"description"`

		// Additional properties allowed
		DockerWorkerTaskDefinition json.RawMessage `json:"dockerWorkerTaskDefinition"`

		// Additional properties allowed
		GenericWorkerTaskDefinition json.RawMessage `json:"genericWorkerTaskDefinition"`

		// Name for the test case
		Name string `json:"name"`
	}

	// A test case contains a static input Docker Worker task payload, and an
	// expected Generic Worker task payload output. The Docker Worker task payload
	// is converted by d2g to a Generic Worker task payload. The test is successful
	// if the generated Generic Worker task payload exactly matches the Generic
	// Worker task payload in the test case.
	TaskPayloadTestCase struct {

		// Configuration options for the d2g translation
		D2GConfig D2GConfiguration `json:"d2gConfig"`

		// Detailed information about what the test case tests
		Description string `json:"description"`

		// Additional properties allowed
		DockerWorkerTaskPayload json.RawMessage `json:"dockerWorkerTaskPayload"`

		// Additional properties allowed
		GenericWorkerTaskPayload json.RawMessage `json:"genericWorkerTaskPayload"`

		// Name for the test case
		Name string `json:"name"`
	}

	// A suite of tests for a particular d2g feature or set of features
	TestSuite struct {

		// Detailed information about what the test cases do and do not test
		Description string `json:"description"`

		// Name for the test suite
		Name string `json:"name"`

		// The test cases which this test suite contains
		PayloadTests []TaskPayloadTestCase `json:"payloadTests,omitempty"`

		// The test cases which this test suite contains
		TaskDefTests []TaskDefinitionTestCase `json:"taskDefTests,omitempty"`
	}
)

// Returns json schema for the payload part of the task definition. Please
// note we use a go string and do not load an external file, since we want this
// to be *part of the compiled executable*. If this sat in another file that
// was loaded at runtime, it would not be burned into the build, which would be
// bad for the following two reasons:
//  1. we could no longer distribute a single binary file that didn't require
//     installation/extraction
//  2. the payload schema is specific to the version of the code, therefore
//     should be versioned directly with the code and *frozen on build*.
//
// Run `generic-worker show-payload-schema` to output this schema to standard
// out.
func JSONSchema() string {
	return `{
  "$id": "schemas/test_suites.json#",
  "$schema": "http://json-schema.org/draft-06/schema#",
  "additionalProperties": false,
  "definitions": {
    "caseDescription": {
      "description": "Detailed information about what the test case tests",
      "title": "Test Case Description",
      "type": "string"
    },
    "caseName": {
      "description": "Name for the test case",
      "title": "Test Case Name",
      "type": "string"
    },
    "d2gConfig": {
      "additionalProperties": false,
      "description": "Configuration options for the d2g translation",
      "properties": {
        "allowChainOfTrust": {
          "default": true,
          "type": "boolean"
        },
        "allowDisableSeccomp": {
          "default": true,
          "type": "boolean"
        },
        "allowHostSharedMemory": {
          "default": true,
          "type": "boolean"
        },
        "allowInteractive": {
          "default": true,
          "type": "boolean"
        },
        "allowKVM": {
          "default": true,
          "type": "boolean"
        },
        "allowLoopbackAudio": {
          "default": true,
          "type": "boolean"
        },
        "allowLoopbackVideo": {
          "default": true,
          "type": "boolean"
        },
        "allowPrivileged": {
          "default": true,
          "type": "boolean"
        },
        "allowPtrace": {
          "default": true,
          "type": "boolean"
        },
        "allowTaskclusterProxy": {
          "default": true,
          "type": "boolean"
        },
        "containerEngine": {
          "default": "docker",
          "enum": [
            "docker",
            "podman"
          ],
          "type": "string"
        }
      },
      "title": "d2g Configuration",
      "type": "object"
    },
    "suiteDescription": {
      "description": "Detailed information about what the test cases do and do not test",
      "title": "Test Suite Description",
      "type": "string"
    },
    "suiteName": {
      "description": "Name for the test suite",
      "title": "Test Suite Name",
      "type": "string"
    }
  },
  "description": "Static d2g input/output test cases. Contains pairs of Docker Worker task def/payload\n(inputs) and Generic Worker expected task def/payload (outputs).",
  "properties": {
    "testSuite": {
      "additionalProperties": false,
      "description": "A suite of tests for a particular d2g feature or set of features",
      "properties": {
        "description": {
          "$ref": "#/definitions/suiteDescription"
        },
        "name": {
          "$ref": "#/definitions/suiteName"
        },
        "payloadTests": {
          "description": "The test cases which this test suite contains",
          "items": {
            "additionalProperties": false,
            "description": "A test case contains a static input Docker Worker task payload, and an\nexpected Generic Worker task payload output. The Docker Worker task payload\nis converted by d2g to a Generic Worker task payload. The test is successful\nif the generated Generic Worker task payload exactly matches the Generic\nWorker task payload in the test case.",
            "properties": {
              "d2gConfig": {
                "$ref": "#/definitions/d2gConfig"
              },
              "description": {
                "$ref": "#/definitions/caseDescription"
              },
              "dockerWorkerTaskPayload": {
                "type": "object"
              },
              "genericWorkerTaskPayload": {
                "type": "object"
              },
              "name": {
                "$ref": "#/definitions/caseName"
              }
            },
            "required": [
              "name",
              "description",
              "dockerWorkerTaskPayload",
              "genericWorkerTaskPayload",
              "d2gConfig"
            ],
            "title": "Task payload test case",
            "type": "object"
          },
          "title": "Task payload test cases",
          "type": "array"
        },
        "taskDefTests": {
          "description": "The test cases which this test suite contains",
          "items": {
            "additionalProperties": false,
            "description": "A test case contains a static input Docker Worker task definition, and an\nexpected Generic Worker task definition output. The Docker Worker task definition\nis converted by d2g to a Generic Worker task definition. The test is successful\nif the generated Generic Worker task definition exactly matches the Generic\nWorker task definition in the test case.",
            "properties": {
              "d2gConfig": {
                "$ref": "#/definitions/d2gConfig"
              },
              "description": {
                "$ref": "#/definitions/caseDescription"
              },
              "dockerWorkerTaskDefinition": {
                "type": "object"
              },
              "genericWorkerTaskDefinition": {
                "type": "object"
              },
              "name": {
                "$ref": "#/definitions/caseName"
              }
            },
            "required": [
              "name",
              "description",
              "dockerWorkerTaskDefinition",
              "genericWorkerTaskDefinition",
              "d2gConfig"
            ],
            "title": "Task definition test case",
            "type": "object"
          },
          "title": "Task definition test cases",
          "type": "array"
        }
      },
      "required": [
        "name",
        "description"
      ],
      "title": "Test Suite",
      "type": "object"
    }
  },
  "required": [
    "testSuite"
  ],
  "title": "d2g test cases",
  "type": "object"
}`
}
