<script lang="ts">
	import { enhance } from '$app/forms';
	import localStorageSyncStore from '$lib/localStorageSyncStore';
	import type { Chat } from '$lib/types';
	import SvelteMarkdown from 'svelte-markdown';

	let chatStore = localStorageSyncStore<Array<Chat>>('chats', []);

	let selectedChat = 0;
	let isLoadingNewCase = false;
	const style = 'open-peeps';

	let isHistoryOpen = false;
</script>

<main class="h-screen px-8 py-10 box-border grid !grid-cols-[1fr_3fr] gap-2">
	<section
		class="bg-slate-100 dark:bg-slate-50 dark:bg-opacity-5 box-border mb-0 p-5 space-y-1 overflow-x-hidden whitespace-nowrap float-left"
	>
		<form
			class="my-0"
			method="POST"
			action="?/newChat"
			use:enhance={() => {
				isLoadingNewCase = true;
				return async ({ result, update }) => {
					isLoadingNewCase = false;
					if (result.type == 'success') {
						const profile = result.data;

						chatStore.update((prev) => [
							{
								// eslint-disable-next-line
								// @ts-ignore
								profile,
								messages: []
							},
							...prev
						]);
						selectedChat = 0;
					}
					update();
				};
			}}
		>
			<button
				class="mx-auto bg-teal-700 border-teal-900 hover:bg-teal-600 py-2"
				aria-busy={isLoadingNewCase}
				disabled={isLoadingNewCase}
			>
				+ New Case
			</button>
		</form>
		<div class="overflow-y-scroll h-[calc(100vh-220px)]">
			{#each $chatStore as { profile }, i}
				<div
					class={`flex justify-start gap-4 items-center cursor-pointer py-1 px-2 rounded-md ${
						selectedChat == i
							? 'bg-slate-600 dark:bg-black bg-opacity-20'
							: 'dark:hover:bg-black hover:bg-sky-600 hover:bg-opacity-5'
					}`}
					on:click={() => (selectedChat = i)}
					role="radio"
					aria-checked={selectedChat == i}
					on:keydown={() => {}}
					tabindex={i}
				>
					<img
						src={`https://api.dicebear.com/7.x/${style}/svg?seed=${profile.name.replaceAll(
							' ',
							'-'
						)}`}
						alt={profile.name}
						class="w-8"
					/>
					<div>
						<h6 class="font-medium mb-0">{profile.name}</h6>
						<p class="mb-0 text-xs">{profile.diagnosis}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>
	<section
		class="bg-slate-100 dark:bg-slate-50 dark:bg-opacity-5 box-border mb-0 p-4 pb-0 flex flex-col justify-between float-left"
	>
		{#if $chatStore.length > 0}
			<div class="flex justify-start gap-4 items-start">
				<img
					src={`https://api.dicebear.com/7.x/${style}/svg?seed=${$chatStore[
						selectedChat
					].profile.name.replaceAll(' ', '-')}`}
					alt=""
					class="w-28"
				/>
				<div class="flex flex-col justify-center gap-2">
					<div class="gap-4 flex justify-between items-center mr-4">
						<h1 class="mb-0 inline align-middle">
							<span>
								{$chatStore[selectedChat].profile.name}
							</span>
							<span class="">
								{$chatStore.at(selectedChat)?.profile.sex === 'male' ? '♂' : '♀'}
							</span>
						</h1>
						<button
							class="px-4 py-1 mb-0 w-fit align-middle contrast inline ml-4"
							on:click|preventDefault={() => (isHistoryOpen = !isHistoryOpen)}
						>
							<!-- <svg -->
							<!-- 	xmlns="http://www.w3.org/2000/svg" -->
							<!-- 	fill="none" -->
							<!-- 	viewBox="0 0 24 24" -->
							<!-- 	stroke-width="2" -->
							<!-- 	stroke="currentColor" -->
							<!-- 	class="w-4 h-4 inline -mt-[4px]" -->
							<!-- > -->
							<!-- 	<path -->
							<!-- 		stroke-linecap="round" -->
							<!-- 		stroke-linejoin="round" -->
							<!-- 		d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" -->
							<!-- 	/> -->
							<!-- </svg> -->
							<span class="align-top">Case History</span></button
						>
					</div>
					<p class="mb-0">
						{$chatStore.at(selectedChat)?.profile.summary}
					</p>
				</div>
			</div>
		{/if}
		{#if $chatStore.length > 0}
			<div class="h-96 overflow-y-scroll mb-2 flex-col-reverse flex">
				{#each $chatStore[selectedChat].messages.toReversed() as message}
					<div class={`flex ${message.role == 'user' ? 'justify-end' : ''}`}>
						<p class="mx-4 bg-black bg-opacity-5 py-1 px-2 w-fit rounded-md">
							{message.content}
						</p>
					</div>
				{/each}
			</div>
			<form
				method="POST"
				action="?/sendMessage"
				class="flex gap-1 mb-0"
				use:enhance={({ formData, cancel, formElement }) => {
					const msg = formData.get('message');

					if (typeof msg != 'string') {
						cancel();
						return;
					}

					chatStore.update((prev) => {
						prev[selectedChat].messages.push({
							role: 'user',
							content: msg
						});
						formData.append('messages', JSON.stringify(prev[selectedChat].messages));
						formData.append('profile', JSON.stringify($chatStore[selectedChat].profile));
						return prev;
					});

					formElement.reset();

					return async ({ result, update }) => {
						if (result.type == 'success') {
							const content = result.data?.content;
							if (typeof content != 'string') return;
							chatStore.update((prev) => {
								prev[selectedChat].messages.push({
									role: 'assistant',
									content: content
								});
								return prev;
							});
						}
						update();
					};
				}}
			>
				<input name="message" type="text" class="flex-grow" />
				<button class="aspect-square w-12 border-[1.5px] secondary outline"> ↳ </button>
			</form>
		{:else}
			<div class="h-full flex justify-center items-center">
				<h1 class="text-3xl">PsyChat</h1>
			</div>
		{/if}
	</section>
	<dialog open={isHistoryOpen}>
		<article>
			<button
				aria-label="Close"
				class="close bg-transparent border-transparent z-10 relative right-0"
				on:click={() => (isHistoryOpen = false)}
			/>
			<SvelteMarkdown source={$chatStore.at(selectedChat)?.profile.history} />
		</article>
	</dialog>
	<footer class="col-span-2 text-center py-4">
		<a href="https://www.github.com/brainsaysno/psychat"> ⧉ Página del proyecto </a> ·
		<span>&copy; Nicolás Russo</span>
	</footer>
</main>
