<template>
	<section class="search">
		<header class="search__hero">
			<p class="search__eyebrow">搜索结果</p>
			<h1>“{{ displayQuery }}” 的文章</h1>
			<p class="search__hint">输入关键词，查找标题、摘要、标签或作者匹配的内容。</p>

			<div class="search__bar">
				<input
					v-model="searchInput"
                    ref="inputEl"
					type="text"
					placeholder="搜索文章、标签或作者..."
                    autocomplete="off"
					@keyup.enter="applySearch"
                    @focus="openDropdown"
                    @input="openDropdown"
				/>
				<button type="button" @click="applySearch">搜索</button>
			</div>

            <div v-show="showDropdown" ref="dropdownEl" class="search__dropdown" role="listbox">
                <div class="dropdown__section">
                    <div class="dropdown__header">
                        <span>推荐阅读</span>
                        <span class="dropdown__hint">随机挑选高阅读量文章</span>
                    </div>
                       <ol class="hot-list">
                           <li v-for="(post, index) in recommendedPosts" :key="post.id">
                               <button type="button" class="hot-list__item" @click="selectSuggestion(post.title)">
                                   <span class="hot-list__rank" :data-top="index < 3">{{ index + 1 }}</span>
                                   <span class="hot-list__text">{{ post.title }}</span>
                                   <span class="hot-list__meta">{{ post.readMinutes }} 分钟读完</span>
                               </button>
                           </li>
                       </ol>
                </div>

                <div v-if="searchHistory.length" class="dropdown__section">
                    <div class="dropdown__header">
                        <span>搜索历史</span>
                        <button type="button" class="link-btn" @click="clearHistory">清空搜索历史</button>
                    </div>
                    <div class="history-list">
                        <button
                            v-for="item in searchHistory"
                            :key="item"
                            type="button"
                            class="chip"
                            @click="selectSuggestion(item)"
                        >
                            {{ item }}
                        </button>
                    </div>
                </div>

                <div v-if="normalizedQuery && suggestionPosts.length" class="dropdown__section">
                    <div class="dropdown__header">
                        <span>匹配结果</span>
                        <span class="dropdown__hint">按相关度排序</span>
                    </div>
                    <ul class="suggestion-list">
                        <li v-for="post in suggestionPosts" :key="post.id">
                            <button type="button" class="suggestion" @click="selectSuggestion(post.title)">
                                <span class="suggestion__title">{{ post.title }}</span>
                                <span class="suggestion__meta">
                                    {{ post.author.name }} · {{ formatDate(post.publishedAt) }}
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>

                <div v-else-if="normalizedQuery" class="dropdown__section dropdown__section--empty">
                    <span>暂无匹配项，换个关键词试试</span>
                </div>
            </div>

			<p v-if="!loading && !error" class="search__meta">
				共 {{ filteredPosts.length }} 篇匹配结果
			</p>
		</header>

		<section class="feed" aria-live="polite">
			<div v-if="loading" class="feed__state">正在搜索...</div>
			<div v-else-if="error" class="feed__state feed__state--error">{{ error }}</div>

			<div v-else>
				<div v-if="!filteredPosts.length" class="feed__state feed__state--empty">
					<p>没有找到相关内容，试试其他关键词？</p>
				</div>

				<div v-else class="feed__grid feed__grid--list">
					<article v-for="post in filteredPosts" :key="post.id" class="post-card post-card--list">
						<router-link :to="`/article/${post.slug}`" class="card-link-wrapper">
							<img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" class="post-card__cover" />

							<div class="post-card__body">
								<div class="post-card__meta">
									<span class="post-card__date">{{ formatDate(post.publishedAt) }}</span>
									<span class="post-card__dot" aria-hidden="true">•</span>
									<span>{{ post.readMinutes }} 分钟读完</span>
								</div>

								<h3>{{ post.title }}</h3>
								<p class="post-card__excerpt">{{ post.excerpt }}</p>

								<div class="post-card__footer">
									<div class="author">
										<img v-if="post.author.avatarUrl" :src="post.author.avatarUrl" :alt="post.author.name" />
										<span>{{ post.author.name }}</span>
									</div>

									<div class="tags">
										<span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
									</div>
								</div>
							</div>
						</router-link>
					</article>
				</div>
			</div>
		</section>
	</section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const posts = ref<Post[]>([])
const searchInput = ref<string>((route.query.q as string) ?? '')
const showDropdown = ref(false)
const searchHistory = ref<string[]>([])
const recommendedPosts = ref<Post[]>([])
const inputEl = ref<HTMLInputElement | null>(null)
const dropdownEl = ref<HTMLElement | null>(null)

const HISTORY_KEY = 'blog_search_history'

const normalizedQuery = computed(() => searchInput.value.trim().toLowerCase())
const displayQuery = computed(() => searchInput.value.trim() || '全部')

const rankedByRelevance = computed(() => {
    const query = normalizedQuery.value
    if (!query) return [] as { post: Post; score: number }[]

    return posts.value
        .map((post) => ({ post, score: relevanceScore(post, query) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || sortByDateDesc(a.post, b.post))
})

const filteredPosts = computed(() => {
    const query = normalizedQuery.value
    if (!query) return posts.value.slice().sort(sortByDateDesc)
    return rankedByRelevance.value.map((item) => item.post)
})

const suggestionPosts = computed(() => rankedByRelevance.value.slice(0, 5).map((item) => item.post))

onMounted(async () => {
    loadHistory()
    document.addEventListener('click', handleOutsideClick)

	try {
		posts.value = await fetchPosts()
        refreshRecommendations()
	} catch (err) {
		error.value = err instanceof Error ? err.message : '加载搜索结果失败'
	} finally {
		loading.value = false
	}
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick)
})

watch(
	() => route.query.q,
	(value) => {
		searchInput.value = (value as string) ?? ''
	}
)

watch(normalizedQuery, () => {
    showDropdown.value = true
})

function applySearch() {
	const q = searchInput.value.trim()
    if (q) persistHistory(q)
    showDropdown.value = false
    router.push({ path: '/search', query: q ? { q } : {} })
}

function selectSuggestion(term: string) {
    searchInput.value = term
    applySearch()
}

function sortByDateDesc(a: Post, b: Post) {
	return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

function formatDate(dateIso: string) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(new Date(dateIso))
}

function relevanceScore(post: Post, query: string) {
    const title = post.title.toLowerCase()
    const excerpt = (post.excerpt ?? '').toLowerCase()
    const author = (post.author?.name ?? '').toLowerCase()
    const tags = post.tags.map((tag) => tag.toLowerCase())
    let score = 0

    if (title.includes(query)) score += 6
    if (excerpt.includes(query)) score += 3
    if (author.includes(query)) score += 2
    const tagHits = tags.reduce((total, tag) => (tag.includes(query) ? total + 3 : total), 0)
    score += tagHits

    const frequency = (title + ' ' + excerpt).split(query).length - 1
    score += frequency

    return score
}

function refreshRecommendations() {
    const sortedByRead = posts.value.slice().sort((a, b) => b.readMinutes - a.readMinutes)
    const topPool = sortedByRead.slice(0, Math.max(6, Math.min(12, sortedByRead.length)))
    const shuffled = topPool.sort(() => Math.random() - 0.5)
    recommendedPosts.value = shuffled.slice(0, Math.min(6, shuffled.length))
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            searchHistory.value = parsed.slice(0, 12)
        }
    } catch (err) {
        console.warn('无法读取搜索历史', err)
    }
}

function persistHistory(term: string) {
    const normalized = term.trim()
    if (!normalized) return
    const next = [normalized, ...searchHistory.value.filter((item) => item !== normalized)].slice(0, 12)
    searchHistory.value = next
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function clearHistory() {
    searchHistory.value = []
    localStorage.removeItem(HISTORY_KEY)
}

function openDropdown() {
    showDropdown.value = true
}

function handleOutsideClick(event: MouseEvent) {
    const target = event.target as Node
    const insideDropdown = dropdownEl.value?.contains(target)
    const insideInput = inputEl.value?.contains(target)
    if (!insideDropdown && !insideInput) {
        showDropdown.value = false
    }
}
</script>

<style scoped lang="less">
.search {
    width: 100%;
    padding: 80px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.search__hero {
    max-width: 960px;
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;

    h1 {
        margin: 0;
        font-size: clamp(1.8rem, 3vw, 2.4rem);
        color: #0f172a;
    }
}

.search__eyebrow {
    margin: 0;
    color: #3b82f6;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.search__hint,
.search__meta {
    margin: 0;
    color: #475569;
}

.search__dropdown {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: calc(100% + 0.5rem);
    width: 100%;
    max-width: 720px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.25rem;
    text-align: left;
    z-index: 5;
}

.dropdown__section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &--empty {
        color: #94a3b8;
    }
}

.dropdown__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: #0f172a;
}

.dropdown__hint {
    font-weight: 500;
    color: #94a3b8;
    font-size: 0.9rem;
}

.hot-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.6rem;
}

.hot-list__item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    text-align: left;

    &:hover {
        transform: translateY(-1px);
        border-color: #2563eb;
        box-shadow: 0 10px 26px rgba(37, 99, 235, 0.12);
    }
}

.hot-list__rank {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    background: #e2e8f0;
    color: #0f172a;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.hot-list__rank[data-top='true'] {
    background: #f87171;
    color: #fff;
}

.hot-list__text {
    flex: 1;
    color: #0f172a;
    font-weight: 600;
}

.hot-list__meta {
    color: #94a3b8;
    font-size: 0.9rem;
}

.badge {
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;

    &--hot {
        background: #fee2e2;
        color: #b91c1c;
    }
}

.history-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.chip {
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #0f172a;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        border-color: #2563eb;
        color: #2563eb;
        background: #eef2ff;
    }
}

.link-btn {
    background: none;
    border: none;
    color: #2563eb;
    cursor: pointer;
    font-weight: 600;
    padding: 0;
}

.suggestion-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.suggestion {
    width: 100%;
    padding: 0.75rem 0.85rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover {
        border-color: #2563eb;
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
    }
}

.suggestion__title {
    display: block;
    color: #0f172a;
    font-weight: 700;
    margin-bottom: 0.15rem;
}

.suggestion__meta {
    color: #94a3b8;
    font-size: 0.9rem;
}

.search__bar {
    margin: 0.5rem auto 0;
    width: 100%;
    max-width: 620px;
    display: flex;
    gap: 0.75rem;

    input {
        flex: 1;
        padding: 0.85rem 1rem;
        border-radius: 12px;
        border: 1px solid #cbd5f5;
        background: #fff;
        font-size: 1rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;

        &:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
        }
    }

    button {
        padding: 0 1.4rem;
        border: none;
        border-radius: 12px;
        background: #2563eb;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(37, 99, 235, 0.24);
        }
    }
}

.feed {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    padding-bottom: 8px;

    &__state {
        padding: 2rem;
        text-align: center;
        border-radius: 16px;
        background: #0a1825;
        color: #475569;

        &--error {
            background: #fee2e2;
            color: #b91c1c;
        }

        &--empty {
            background: #eef2ff;
            color: #4338ca;
        }
    }

    &__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
    }
}

.card-link-wrapper {
    text-decoration: none;
    color: inherit;
    display: contents;
}

.post-card {
    display: flex;
    flex-direction: row;
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
    }

    &__cover {
        width: 320px;
        height: auto;
        flex-shrink: 0;
        object-fit: cover;
    }

    &__body {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        padding: 1.4rem;
        flex: 1;
    }

    &__meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: #64748b;
        font-size: 0.9rem;
    }

    &__dot {
        opacity: 0.6;
    }

    h3 {
        margin: 0;
        font-size: 1.35rem;
        color: #0f172a;
    }

    &__excerpt {
        margin: 0;
        color: #475569;
        line-height: 1.6;
        flex-grow: 1;
    }

    &__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
}

.author {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }
}

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    .tag {
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 0.85rem;
    }
}

@media (max-width: 900px) {
    .post-card {
        flex-direction: column;

        &__cover {
            width: 100%;
            height: 200px;
        }
    }

    .search__bar {
        flex-direction: column;

        button {
            width: 100%;
        }
    }
}
</style>