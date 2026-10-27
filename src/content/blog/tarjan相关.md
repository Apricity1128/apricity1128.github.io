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



