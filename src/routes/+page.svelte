<script lang="ts">
	import { onMount } from 'svelte';
	let token: string = "";
	interface Vector {
		result: string;
		docsConsidered: {url: string, contentSnippet: string}[];
		stats: {
			docCount: number;
			splitCount: number;
		};
	}
	let question: string = "";

	onMount(() => {
		question = import.meta.env.VITE_DEMO_QUESTION || "";
		token = import.meta.env.VITE_DEMO_TOKEN || "";
	});
	let processing_question: boolean = false;
	let answer: string = ""; 
	let vector: Vector = {result: "", docsConsidered: [], stats: {docCount: 0, splitCount: 0}}; 
	let responsedetails: string = ""; 

	async function fetchSearchDetails() {
		if (question.trim() === "") {
			answer = "Please enter a valid question";
			return;
		}
		if (processing_question) {
			return;
		}
		console.log("processing question: " + question);
		answer = "";
		responsedetails = "";
		processing_question = true;
		const formattedQuestion = encodeURIComponent(question);
		const url = `http://localhost:8787/api/searchdetail?query=${formattedQuestion}`;

		try {
			await fetch(url, {
				headers: {
					'password': token
				}
			}).then(async (response) => {
				if (response.status === 200) {
					responsedetails = await response.text();
					let details_obj = JSON.parse(responsedetails);
					vector = details_obj.vector;
					answer = vector.result;
				} else {
					const error_response: any = await response.text();
					answer = "Unable to search for answer due to '" + error_response + "'";
				}
			}).catch((error) => {
				console.error("Error fetching search details:", error);
			}).finally(() => {
				processing_question = false;
			});
		} catch (error) {
			console.error("Error fetching search details:", error);
		}
	}

	async function handleSubmit() {
		await fetchSearchDetails();
	}
</script>

<svelte:head>
	<title>Web Search Assistant</title>
	<meta name="description" content="Web Search Assistant" />
</svelte:head>

<section>
	<h1>Hello, I am your Web Search Assistant!</h1>
	<i>Enter a question and I'll do the rest.</i>
	<form on:submit|preventDefault={handleSubmit}>
		<input class="question" type="text" bind:value={question}
			placeholder="Ask your question here..."/>
		<button type="submit" class:processing={processing_question}>{processing_question ? "Processing..." : "Query for answer"}</button>
		<input class="token" type="password" bind:value={token}
		       placeholder="token"/>
	</form>

	
	<div class="outputsection answer">
		{#if processing_question}
			<p>Reading news, thinking, answering. Please be patient. (Usually done in around 10 seconds)</p>
		{:else}
			<h2>Answer:</h2>
			<p class="answertext">{answer}</p>
		{/if}
	</div>

	<div class="outputsection considered">
		<p>Considered pieces of information: (Doc Count: {vector.stats.docCount}, Split Count: {vector.stats.splitCount})</p>
		{#each vector.docsConsidered as doc}
			<a href={doc.url} target="_blank">{doc.url}</a>
			<div class="docsnippet">{doc.contentSnippet}</div>
		{/each}
	</div>

	<div class="outputsection details">
		<h2>Details:</h2>
		<div class="responsedetails">{responsedetails}</div>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	form {
		width: 75%;
		margin-top: 10px;
	}
	.outputsection {
		width: 75%;
		min-height: 100px;
		margin-top: 10px;
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		margin-bottom: 10px;
		font-size: 14px;
	}
	.outputsection .answertext {
		font-weight: bold;
		padding-left: 10px;
	}
	.outputsection .docsnippet {
		font-style: italic;
		height: 100px;
		overflow: scroll;
	}
	.outputsection.details {
		display: none;
	}
	.outputsection .responsedetails {
		font-style: italic;
		height: 300px;
		overflow: scroll;
	}

	input {
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		margin-bottom: 10px;
		font-size: 16px;
	}
	input.question {
		width: 100%;
	}
	input.token {
		float: right;
		width: 200px;
	}

	button {
		width: 200px;
		padding: 8px 12px;
		background-color: rgb(134, 162, 217);
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	button:hover {
		background-color: #4c7bd9;
	}

	button.processing {
		cursor: wait;
		animation: gradientBG 1s infinite alternate;
	}
	@keyframes gradientBG {
		from {
			background-color: #b1c7f1;
		}
		to {
			background-color: #7a9bdb;
		}
	}

	h1 {
		width: 100%;
	}
</style>
