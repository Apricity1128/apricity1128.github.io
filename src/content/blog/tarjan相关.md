## Tarjan

概念：

1. 强连通分量：有向图中的极大强连通子图（SCC）
2. 缩点：有向图中的每个SCC转换为一个点，剩下一个有向无环图DAG。
3. 边/点双连通分量（BCC）：连通无向图中无论删掉哪一条边/点，剩下任意两点都连通。
4. 割点和桥。

回忆：邻接表实现

```cpp
const int N=1e5+500;
struct edge{
	int to,nxt;
}e[N*2];
int tot=1;
int head[N];
inline void add(int u,int v) {
	e[++tot].nxt=head[u],e[tot].to=v;head[u]=tot;
	return ;
}
/*---------------- 割边模板开始 ----------------*/
int dfn[N],low[N],tim;
bool isbridge[N*2];       // 标记边 i 是否为桥（i 与 i^1 同一条无向边）
int bridge[N],bcnt;       // 存桥的边编号
void tarjan(int x,int in_edge) {
	dfn[x]=low[x]=++tim;
	for(int i=head[x];i;i=e[i].nxt) {
		int y=e[i].to;
		if(!dfn[y]) {
			tarjan(y,i);                   // i 作为从 x 走向 y 的边
			low[x]=min(low[x],low[y]);
			if(low[y]>dfn[x]) {            // 桥判定
				isbridge[i]=isbridge[i^1]=1;
				bridge[++bcnt]=i;
			}
		} else if(i!=(in_edge^1)) {        // 不是回父边的反向边
			low[x]=min(low[x],dfn[y]);     // 用祖先 dfn 更新（重边也正确）
		}
	}
	return ;
}
```



# Tarjan

## 有向图强连通分量

`scc` 缩点后是 `DAG`

`dfs` 生成树的四种边

- 树边
- 返祖边：指向搜索树祖先
- 横叉边：指向另一棵搜索树
- 前向边：指向搜索树子树

定理：设 $u$ 为一个 scc 的第一个访问的节点，则整个 scc 都在其子树内，且未被访问。

注意有向图的 `low` 定义有所不同：在 $u$ 子树内，能回溯到的最早的，**在栈中** 的节点。

scc缩点时，需要用一个栈来维护，而且只有在 $y$ 在栈里时，才用 $dfn_y$ 更新 $low_x$ 。

如果要建新图，则需要重边去重，可以在对 `vector` 排序后 `erase(unique(s.begin(),s.end()),s.end())` 。

一般来说，缩点后的 `vector` 编号即是 拓扑排序的倒序。

## 无向图割点，点双

对于求割点，要特殊判断每个联通块的根节点，即其 **搜索子树的个数是否大于1** .

判断 `x` 是割点：`low[y]>=dfn[x]` 。但如果 `x` 是根，且只有一棵子树的情况是不对的。

对于求点双，注意割点同时存在于多个点双内，所以出栈时只能出到 $y$ 而非 $x$ ，同时 `vector` 进入 $x$ 。
