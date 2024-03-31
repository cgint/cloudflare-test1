<script lang="ts">
	import { onMount } from 'svelte';

	let token: string = "";
	interface Vector {
		result: string;
		docsConsidered: {
			url: string;
			age_normalized: string;
			contentSnippet: string;
		}[];
		stats: {
			docCount: number;
			splitCount: number;
		};
	}
	let RR_EMPTY = {
		result: "",
		docsConsidered: [],
		stats: { docCount: 0, splitCount: 0 },
	};
	let question: string = "";
	let freshness: string = "";

	onMount(() => {
		question = import.meta.env.VITE_DEMO_QUESTION || "";
		token = import.meta.env.VITE_DEMO_TOKEN || "";
	});

	let processing_question: boolean = false;
	let answer: string = "";
	let rag_result: Vector = RR_EMPTY;
	let responsedetails: string = "";

	let speechSynthesisSupportedCheckDone = false;
	let speechSynthesisSupported = false;
	let autoSpeak = false;
	let isSpeaking = false;

	onMount(() => {
		speechSynthesisSupported = "speechSynthesis" in window;
		speechSynthesisSupportedCheckDone = true;
		if (speechSynthesisSupported) {
			window.setInterval(() => {
				isSpeaking = window.speechSynthesis.speaking;
			}, 1000);
		}
	});

	// start watching of answer for autoSpeak-functionality
	$: if (answer !== "" && speechSynthesisSupported && autoSpeak) {
		startSpeakAnswer();
	}

	function startSpeakAnswer() {
		speakText(answer);
	}
	function speakText(text: string) {
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
	}
	function stopSpeakAnswer() {
		window.speechSynthesis.cancel();
	}

	async function searchForAnswer() {
		if (question.trim() === "") {
			answer = "Please enter a valid question";
			return;
		}
		if (processing_question) {
			return;
		}
		console.log("processing question: " + question);
		answer = "";
		rag_result = RR_EMPTY;
		responsedetails = "";
		processing_question = true;
		const formattedQuestion = encodeURIComponent(question);
		const url = `/api/searchdetail?query=${formattedQuestion}&freshness=${freshness}`;

		try {
			await fetch(url, {
				headers: {
					password: token,
				},
			})
				.then(async (response) => {
					if (response.status === 200) {
						responsedetails = await response.text();
						let details_obj = JSON.parse(responsedetails);
						rag_result = details_obj.vector;
						answer = rag_result.result;
					} else {
						const error_response: any = await response.text();
						answer =
							"Unable to search for answer due to '" +
							error_response +
							"'";
					}
				})
				.catch((error) => {
					console.error("Error fetching search details:", error);
				})
				.finally(() => {
					processing_question = false;
				});
		} catch (error) {
			console.error("Error fetching search details:", error);
		}
	}
</script>

<svelte:head>
	<title>Web Search Assistant</title>
	<meta name="description" content="Web Search Assistant" />
</svelte:head>

<section>
	<h1>Hello, I am your <nobr>Web Search Assistant!</nobr></h1>
	<div class="formanddata">
		<form on:submit|preventDefault={searchForAnswer}>
			<div class="formsettings">
				<div class="token">
					<input
						class="token"
						type="password"
						bind:value={token}
						placeholder="***"
					/>
				</div>
				<div class="autospeak">
					<input
						id="autospeak"
						type="checkbox"
						bind:checked={autoSpeak}
					/>
					<label for="autospeak">AutoSpeak</label>
				</div>
				<div class="freshness">
					<select bind:value={freshness}>
						<option value="pd">Past Day</option>
						<option value="pw">Past Week</option>
						<option value="pm">Past Month</option>
						<option value="py">Past Year</option>
						<option value="">All Time</option>
					</select>
				</div>
			</div>
			<input
				class="question"
				type="text"
				bind:value={question}
				placeholder="Ask your question here..."
			/>
			<button
				class="activebutton"
				class:processing={processing_question}
				type="submit"
				>{processing_question
					? "Processing..."
					: "Query for answer"}</button
			>
		</form>

		<div class="outputsection answer">
			{#if processing_question}
				<h2>Processing ...</h2>
				<p>
					Reading news, thinking, answering. Please be patient.
					(Usually done in around 10 seconds)
				</p>
			{:else}
				<div style="float: right;">
					{#if speechSynthesisSupported}
						{#if isSpeaking}
							<button
								class="activebutton processing"
								on:click={stopSpeakAnswer}>Stop speaking</button
							>
						{:else if autoSpeak}
							<p>AutoSpeak is on</p>
						{:else if answer !== ""}
							<button
								class="activebutton"
								on:click={startSpeakAnswer}>Speak answer</button
							>
						{/if}
					{:else if speechSynthesisSupportedCheckDone}
						<p>Speech not supported by browser</p>
					{/if}
				</div>
				<h2>Answer:</h2>
				<p class="answertext">{answer}</p>
			{/if}
		</div>

		<div class="outputsection considered">
			{#if !processing_question}
				<p>
					Considered pieces of information: (Doc Count: {rag_result
						.stats.docCount}, Split Count: {rag_result.stats
						.splitCount})
				</p>
				{#each rag_result.docsConsidered as doc}
					<span class="agenormalized">({doc.age_normalized})</span
					>
					<a href={doc.url} target="_blank">{doc.url}</a>
					<div class="docsnippet">{doc.contentSnippet}</div>
				{/each}
			{/if}
		</div>

		<div class="outputsection details">
			<h2>Details:</h2>
			<div class="responsedetails">{responsedetails}</div>
		</div>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		/* flex: 0.6; */
	}
	div.formanddata {
		width: 100%;
	}
	@media (min-width: 480px) {
		div.formanddata {
			width: 75%;
		}
	}

	form {
		width: 100%;
		margin-top: 10px;
	}
	div.formsettings div.autospeak {
		float: right;
		margin-right: 10px;
	}
	div.formsettings div.token {
		float: right;
	}
	div.formsettings div.freshness {
		float: left;
		margin-left: 10px;
	}
	input.token {
		width: 80px;
	}
	.outputsection {
		width: 100%;
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
	.outputsection .agenormalized {
		font-size: 0.8em;
		font-style: italic;
		color: #666;
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

	button.activebutton {
		width: 180px;
		white-space: nowrap;
		padding: 8px 12px;
		background-color: rgb(134, 162, 217);
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	button.activebutton:hover {
		background-color: #4c7bd9;
	}

	button.activebutton.processing {
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
