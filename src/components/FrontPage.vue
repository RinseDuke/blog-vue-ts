<template>
	<section class="front">
		<!-- <header class="normal">
			<div class="normal__content">
				<h1>标题</h1>
				<p class="normal__subtitle">
					简介
				</p>
				<div class="normal__actions">
					<button @click="startReading" type="button" class="btn primary">开始阅读</button>
					<button @click="startWriting" type="button" class="btn secondary">开始写作</button>
				</div>
			</div>
			<img
				class="normal__cover"
				src="https://i.pximg.net/img-master/img/2025/03/09/21/29/59/128037527_p0_master1200.jpg"
				alt="图片"
			/>
		</header> -->

		<section class="feed" aria-live="polite">
			<!-- <header class="feed__head">
				<h2>最新文章</h2>
			
            布局切换按钮
                <button
                    type="button"
                    class="view-toggle"
                    :aria-label="isGridMode?'切换到列表视图':'切换到网格视图'"
                    @click="toggleLayout(isGridMode?'list':'grid')"
                    
                >
                <svg
                    v-if="isGridMode"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    >
                    <path
                     d="M4 5h16v2H4zm0 6h16v2H4zm0 6h16v2H4z" 
                     fill="currentColor"
                    />
                </svg>  
                <svg
                    v-else
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M4 4h7v7H4zm9 0h7v7h-7zm0 9h7v7h-7zm-9 0h7v7H4z"
                        fill="currentColor"
                    />
                </svg>
                </button>
            
            
            </header> -->
			<div v-if="loading" class="feed__state">加载中...</div>
			<div v-else-if="error" class="feed__state feed__state--error">{{ error }}</div>
            
			<div v-else >
                <div class="list-wrapper">
                <header class="feed__head">
                    <h2>文章列表</h2>
                </header>
                <div class="feed__grid feed__grid--list">
				<article v-for="post in latestPosts" :key="post.id" class="post-card post-card--list">
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
			</div>
            
		</section>
	</section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/services/postService'

const loading = ref(true)               // 加载状态
const error = ref<string | null>(null)      // 错误信息
const posts = ref<Post[]>([])               // 所有文章数据
const layoutMode=ref<'grid'|'list'>('grid') // 布局模式（默认grid）
// 计算是否是网格模式
const isGridMode=computed(()=>layoutMode.value==='grid')
// 最新文章，按发布日期降序排序
const latestPosts = computed(() => posts.value.slice().sort(sortByDateDesc))

onMounted(async () => {
	try {
		posts.value = await fetchPosts()
	} catch (err) {
		error.value = err instanceof Error ? err.message : '加载文章失败'
	} finally {
		loading.value = false
	}
})


// 开始写作
function startReading() {
    const firstPost = latestPosts.value[0]
    if (firstPost) {
        window.location.href = `/posts/${firstPost.id}`
    }
}
// 开始写作
function startWriting() {
    window.location.href = '/write'
}

//切换显示
function toggleLayout(mode:'grid'|'list'){
    layoutMode.value=mode
}

//按日期排序文章
function sortByDateDesc(a: Post, b: Post) {
	return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
}

//格式化日期
function formatDate(dateIso: string) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(new Date(dateIso))
}
</script>


<style scoped lang="less">
.front {
    width: 100%;
    padding: 60px 20px 40px 20px;


}

.list-wrapper {
    max-width: 900px;
    width: 50%;
    margin: 0 auto;
}

.normal {
    display: grid;
    gap: 3rem;
    align-items: center;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    background: linear-gradient(135deg, #f8fafc, #eef2ff);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    width: auto;
    margin: 0 auto 4rem auto;
    padding: 0;

    &__content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    // &__badge {
    //     align-self: flex-start;
    //     padding: 0.4rem 0.9rem;
    //     border-radius: 999px;
    //     font-size: 0.875rem;
    //     font-weight: 600;
    //     background: rgba(59, 130, 246, 0.12);
    //     color: #1d4ed8;
    // }

    h1 {
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 1.2;
        margin: 0;
        color: #0f172a;
    }

    &__subtitle {
        font-size: 1.05rem;
        line-height: 1.8;
        color: #475569;
        margin: 0;
    }

    &__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }

    &__cover {
        width: 100%;
        border-radius: 20px;
        object-fit: cover;
        box-shadow: 0 15px 40px rgba(15, 23, 42, 0.1);
        min-height: 240px;
    }
}

.btn {
    border: none;
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &.primary {
        background: #2563eb;
        color: #fff;
        box-shadow: 0 10px 24px rgba(37, 99, 235, 0.26);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 32px rgba(37, 99, 235, 0.36);
        }
    }

    &.secondary {
        background: #e2e8f0;
        color: #1e293b;

        &:hover {
            transform: translateY(-2px);
        }
    }
}

.card-link-wrapper {
    text-decoration: none;
    color: inherit;
    display: contents;
}

.feed {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;

    &__head {
        display: flex;
        align-items: left;
        justify-content: space-between;
        flex-direction: row;
        gap: 1rem;


        h2 {
            margin: 0;
            font-size: 2rem;
        }

        // 切换视图按钮
        .feed__view-switch {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }

        // 切换视图按钮
        .view-btn {
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            border: 1px solid #cbd5f5;
            cursor: pointer;
            color: #2563eb;
            background: #fff;
            transition: all 0.2s ease;

            &.active {
                background: #2563eb;
                color: #fff;
                border-color: transparent;
            }

        }

        p {
            margin: 0;
            color: #475569;
        }
    }

    &__state {
        padding: 2rem;
        text-align: center;
        border-radius: 16px;
        background: #f1f5f9;
        color: #475569;

        &--error {
            background: #fee2e2;
            color: #b91c1c;
        }
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;

        &--list {
            grid-template-columns: 1fr;
        }
    }

    //列表
    // .post-card {
    //     display: flex;
    //     flex-direction: row;

    //     &--list {
    //         flex-direction: column;
    //         min-height: 110px;

    //         //背景
    //         .post-card__cover {
    //             width: 30%;
    //             height: 100%;
    //         }

    //         .post-card__body {
    //             width: 70%;
    //         }
    //     }
    // }

    //卡片
    .post-card {
        display: flex;
        flex-direction: column;
        background: #fff;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-6px);
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
        }

        &.post-card--list {
            flex-direction: row;
            align-items: stretch;


            .post-card__cover {
                width: 350px;
                height: auto;
                flex-shrink: 0;
            }

            .post-card__body {
                flex: 1;
            }
        }

        &__cover {
            width: 100%;
            height: 180px;
            object-fit: cover;
        }

        // 内容区域
        &__body {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
            flex: 1;
        }

        &__meta {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #64748b;
            font-size: 0.9rem;
        }

        &__dot {
            opacity: 0.6;
        }

        h3 {
            margin: 0;
            font-size: 1.4rem;
            color: #0f172a;
        }

        // 摘要
        &__excerpt {
            margin: 0;
            color: #475569;
            line-height: 1.6;
            flex-grow: 1;
        }

        // 底部信息
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
            padding: 0.4rem 0.7rem;
            border-radius: 999px;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 0.85rem;
        }
    }

    //布局切换按钮
    .view-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 40px;
        border: 1px solid #cbd5f5;
        border-radius: 12px;
        color: #2563eb; // 图标颜色 
        transition: all 0.2s ease;

        svg {
            width: 20px;
            height: 20px;
        }

        &:hover {
            background: rgba(37, 99, 235, 0.08);
            border-color: transparent;
        }
    }


}
</style>
