<template>
  <div class="article-container">
    <!-- 状态处理 -->
    <div v-if="loading" class="status-message">
      加载中...
    </div>
    <div v-else-if="error" class="status-message error">{{ error }}</div>
    <!-- body -->
     <article v-else-if="post" class="article-content">
      <header class="article-header">
        <h1 class="article-title"> {{ post.title }}</h1>
        <p class="article-excerpt">{{ post.excerpt }}</p>
        <div class="article-meta">
          <div class="author-info">
            <img :src="post.author.avatarUrl" :alt="post.author.name" class="author-avatar">
            <div>
              <span class="author-name">{{ post.author.name }}</span>
              <span class="publish-date">{{ formatDate(post.publishedAt) }}</span>
            </div>
          </div>
        </div>
      </header>

      <figure v-if="post.coverImage" class="cover-image-container">
        <img :src="post.coverImage" :alt="post.title">
        <figcaption></figcaption>
      </figure>

      <div class="article-body" v-html="post.content || '<h3>内容缺失</h3><p>这篇文章的正文内容还没有提供，这里暂时显示摘要信息。</p>' + post.excerpt">
      </div>

      <footer class="article-footer">
        <div class="tags">
          <span v-for="tag in post.tags" :key="tag" class="tag" >#{{ tag }}</span>
        </div>
        <router-link to="/" class="back-line">← 返回首页</router-link>
      </footer>
     </article>
  </div>
</template>


<script setup lang="ts">
import {ref,reactive, onMounted} from 'vue'
import type { Post } from '@/types/post'
import { fetchPostBySlug } from '@/services/postService'
import { useRoute} from 'vue-router'


const route=useRoute()                  //获取路由信息
const post = ref<Post | null>(null)   //文章数据
const loading = ref<boolean>(true) //加载状态
const error = ref<string | null>(null) //错误信息

onMounted(async()=>{
  //获取路由
  const slug=route.params.slug as string
  if(!slug){
    error.value='文章不存在'
    loading.value=false
    return
  }
  try{
    const FetchPost=await fetchPostBySlug(slug)
    if(FetchPost){
      post.value=FetchPost
    }
    else{
      error.value='文章不存在'
    }
  }
  catch(e){
    error.value='加载文章时出错'
    console.error(e)
  }
  finally{
    loading.value=false
  }
})

//格式化日期
function formatDate(dateString:string){
  return new Date(dateString).toLocaleDateString('zh-CN' , {
    year:'numeric',
    month:'long',
    day:'numeric'
  })
}

</script>


<style scoped lang="less">
// @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

.article-container {
  max-width: 720px;
  margin: 4rem auto;
  padding: 0 1.5rem;
  font-family: 'Noto Serif SC', serif;
}

.status-message {
  text-align: center;
  color: #64748b;
  font-size: 1.2rem;
  padding: 4rem 0;
}

.article-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 2rem;

  .article-title {
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1.2;
    color: #1e293b;
    margin: 0 0 1rem;
  }

  .article-excerpt {
    font-size: 1.2rem;
    color: #475569;
    margin: 0;
  }
}

.article-meta {
  margin-top: 1.5rem;

  .author-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .author-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
  }

  .author-name {
    display: block;
    font-weight: 700;
    color: #1e293b;
  }

  .publish-date {
    font-size: 0.9rem;
    color: #64748b;
  }
}

//
.cover-image-container {
  margin: 2rem 0;

  img {
    width: 100%;
    border-radius: 8px;
  }

  figcaption {
    font-size: 0.8rem;
    text-align: center;
    color: #94a3b8;
    margin-top: 0.5rem;
  }
}

.article-content {
  line-height: 1.8;
  color: #334155;
  font-size: 1.1rem;

  //首行缩进
  &>p:first-of-type::first-letter {
    float: left;
    font-size: 1.2rem;
    line-height: 1.8;
    padding: 0.2rem 0.5rem 0 0;
    font-weight: 700;
    color: #1e293b;
  }

  h2,
  h3 {
    font-weight: 700;
    color: #1e293b;
    margin-top: 2.5rem;
  }

  p {
    margin-bottom: 1.5rem;
  }

  blockquote {
    margin: 2rem 0;
    padding: 1rem 1.5rem;
    border-left: 3px solid #cbd5e1;
    color: #475569;
    font-size: italic;
  }

  .article-footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    //标签样式
    .tags {
      display: flex;
      gap: 0.5rem;

      .tag {
        color: #64748b;
        font-size: 0.9rem;
      }
    }

    //返回按钮样式
    .back-line {
      color: #64748b;
      text-decoration: none;
      font-weight: 700;

      &:hover {
        text-decoration: underline;
        ;
      }
    }
  }
}
</style>