// This source code file is AUTO-GENERATED by github.com/taskcluster/jsonschema2go

package tcpurgecache

import (
	tcclient "github.com/taskcluster/taskcluster/clients/client-go/v24"
)

type (
	// A list of currently open purge-cache requests. Should not be used by workers.
	OpenAllPurgeRequestsList struct {

		// Passed back from Azure to allow us to page through long result sets.
		ContinuationToken string `json:"continuationToken,omitempty"`

		// A list of Purge Cache requests that the Purge Cache service has previously received.
		Requests []PurgeCacheRequestsEntry `json:"requests"`
	}

	// A list of currently open purge-cache requests.
	OpenPurgeRequestList struct {

		// A list of Purge Cache requests that the Purge Cache service has previously received.
		Requests []PurgeCacheRequestsEntry `json:"requests"`
	}

	// Request that a message be published to purge a specific cache.
	PurgeCacheRequest struct {

		// Name of cache to purge. Notice that if a `workerType` have multiple kinds
		// of caches (with independent names), it should purge all caches identified
		// by `cacheName` regardless of cache type.
		CacheName string `json:"cacheName"`
	}

	// An entry in a list of Purge Cache Requests that the Purge Cache service has previously received.
	PurgeCacheRequestsEntry struct {

		// All caches that match this provisionerId, workerType, and cacheName must be destroyed if they were created _before_ this time.
		Before tcclient.Time `json:"before"`

		// Name of cache to purge.
		CacheName string `json:"cacheName"`

		// ProvisionerId associated with the workerType.
		//
		// Syntax:     ^([a-zA-Z0-9-_]*)$
		// Min length: 1
		// Max length: 38
		ProvisionerID string `json:"provisionerId"`

		// Workertype cache exists on.
		//
		// Syntax:     ^([a-zA-Z0-9-_]*)$
		// Min length: 1
		// Max length: 38
		WorkerType string `json:"workerType"`
	}
)
