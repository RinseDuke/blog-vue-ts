import loginSource from './LoginView.vue?raw'
import registerSource from './RegisterView.vue?raw'
import profileArticlesSource from './ProfileArticlesView.vue?raw'
import publishPanelSource from '../components/post/PublishPanel.vue?raw'

describe('pre-launch hint source contract', () => {
  it('removes publish-time backend limitation hints while keeping publish controls', () => {
    expect(publishPanelSource).not.toContain('当前后端仅支持标题、正文、状态和可见性。')
    expect(publishPanelSource).not.toContain('封面、标签等扩展字段已暂时停用，后续接口补齐后可继续接回。')
    expect(publishPanelSource).not.toContain('publish-note')
    expect(publishPanelSource).toContain('publish-grid')
    expect(publishPanelSource).toContain('DropdownSelect')
  })

  it('removes profile article management backend status hints while keeping management actions', () => {
    expect(profileArticlesSource).not.toContain('后端暂未支持标签字段，相关主题统计和标签展示已先隐藏。')
    expect(profileArticlesSource).not.toContain('接口状态')
    expect(profileArticlesSource).toContain('manage-post-actions')
    expect(profileArticlesSource).toContain('currentDraft')
  })

  it('removes register page rollout hints while keeping the form flow', () => {
    expect(registerSource).not.toContain('当前表单已对齐后端注册规范，注册成功后会自动登录。')
    expect(registerSource).not.toContain('邮箱验证码和扩展资料字段暂未启用，待后端接口补充后再接回。')
    expect(registerSource).not.toContain('register-card__hint')
    expect(registerSource).not.toContain('register-card__note')
    expect(registerSource).toContain('register-form')
    expect(registerSource).toContain('handleSubmit')
  })

  it('removes login page mock and migration hints while keeping login behavior', () => {
    expect(loginSource).not.toContain('Mock 测试账号：')
    expect(loginSource).not.toContain('当前页面已按后端规范切换为用户名登录。')
    expect(loginSource).not.toContain('login-card__mock')
    expect(loginSource).not.toContain('showMockHint')
    expect(loginSource).toContain('login-form')
    expect(loginSource).toContain('usePasswordVisibility')
  })
})
