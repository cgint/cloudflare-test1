<script lang="ts">
	import { onMount } from "svelte";

	let token: string = "";
	interface RagResult {
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
	interface SearchEngineResult {
		searchQuery: string;
		url: string;
		title: string;
		description: string;
		age_normalized: string;
	}
	let RR_EMPTY = {
		result: "",
		docsConsidered: [],
		stats: { docCount: 0, splitCount: 0 },
	};
	let question: string = "";
	let freshness: string = "";
	let customUrls: string = "";

	onMount(() => {
		question = import.meta.env.VITE_DEMO_QUESTION || "";
		customUrls = import.meta.env.VITE_DEMO_URLS || "";
		token = import.meta.env.VITE_DEMO_TOKEN || "";
	});

	let processing_question: boolean = false;
	let answer: string = "";
	let answer_result: RagResult = RR_EMPTY;
	let search_engine_results: SearchEngineResult[] = [];

	let speechSynthesisSupportedCheckDone = false;
	let speechSynthesisSupported = false;
	let autoSpeak = false;
	let useLLMQueries = false;
	let isSpeaking = false;

	onMount(() => {
		speechSynthesisSupported = "speechSynthesis" in window;
		speechSynthesisSupportedCheckDone = true;
		if (speechSynthesisSupported) {
			window.setInterval(() => {
				isSpeaking = window.speechSynthesis.speaking;
			}, 500);
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
		answer_result = RR_EMPTY;
		search_engine_results = [];
		processing_question = true;
		const formattedQuestion = encodeURIComponent(question);
		const formattedURLs = encodeURIComponent(customUrls);
		const url = `/api/searchdetail?query=${formattedQuestion}&freshness=${freshness}&urls=${formattedURLs}&useLLMQueries=${useLLMQueries}`;

		try {
			await fetch(url, {
				headers: {
					password: token,
				},
			})
				.then(async (response) => {
					if (response.status === 200) {
						let details_obj: any = await response.json();
						answer_result = details_obj.answer;
						answer = answer_result.result;
						search_engine_results = details_obj.searchdata;
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
				<div class="use-llm-queries">
					<input
						id="useLLMQueries"
						type="checkbox"
						bind:checked={useLLMQueries}
					/>
					<label for="useLLMQueries">Use LLM for search queries</label>
				</div>
			</div>
			<input
				class="question"
				type="text"
				bind:value={question}
				placeholder="Ask your question here..."
			/>
			<!-- New textarea for URLs -->
			<textarea
				class="custom-urls"
				bind:value={customUrls}
				placeholder="Enter custom URLs here..."
				rows="3"
			></textarea>
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
				<h2>Answer:</h2>
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
				<p class="answertext">{@html answer}</p>
			{/if}
		</div>

		<div class="outputsection considered">
			{#if !processing_question && answer !== ""}
				<p>
					<u>For the answer the following {answer_result.docsConsidered.length} web-page-pieces of information
						were considered: (From {answer_result.stats.splitCount} overall)</u>
				</p>
				{#each answer_result.docsConsidered as doc}
					<div class="consideredcontent" class:single={answer_result.docsConsidered.length === 1}>
						<span class="agenormalized">({doc.age_normalized || 'no date provided'})</span>
						<a href={doc.url} target="_blank">{doc.url}</a>
						<div class="docsnippet">{@html doc.contentSnippet}</div>
					</div>
				{/each}
				<p>
					<u>Initially {search_engine_results.length} web pages found by search engine</u>
				</p>
				{#each search_engine_results as result}
					<div class="searchresult">
						<span class="agenormalized">({result.age_normalized || 'no date provided'})</span>
						<a href={result.url} target="_blank">{result.title}</a>
						<span class="searchquery">SearchQuery: '{result.searchQuery}'</span>
						<div class="docsnippet">{@html result.description}</div>
					</div>
				{/each}
			{/if}
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
	div.formsettings div.use-llm-queries {
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
	.outputsection.considered .consideredcontent,
	.outputsection.considered .searchresult {
		padding-left: 10px;
	}
	.outputsection.considered .docsnippet,
	.outputsection.considered .searchresult .docsnippet {
		margin-top: 5px;
		margin-bottom: 15px;
		margin-left: 5px;
		font-style: italic;
		height: 100px;
		overflow: auto;
	}

	.outputsection.considered .consideredcontent.single .docsnippet {
		height: 300px;
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
	textarea.custom-urls {
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
