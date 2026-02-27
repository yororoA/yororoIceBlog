/*function for data-tree building
* @accept:
* - `metaData`: data needed for building
* - `locationSite`: element for location, such as 'id'
* - `belong`: element for location parent site, such as 'parent'
* @example-data:
* [ { id: 1 }, { id: 2, belong: 1 }, { id: 3, belong: 2 } ]*/
export function treeBuilder(metaData = [], locationSite, belong) {
	const nodeMap = new Map();
	metaData.forEach(node => {
		const copy = {...node};
		nodeMap.set(copy[locationSite], copy);
	});

	// 根节点
	const rootNodes = [];
	metaData.forEach(originalNode => {
		const node = nodeMap.get(originalNode[locationSite]);
		const belongValue = originalNode[belong];
		const isRoot = !(belong in originalNode) || [null, '', undefined].includes(belongValue);
		if (isRoot) rootNodes.push(node);
		else {
			// 挂载子节点
			const parentNode = nodeMap.get(belongValue);
			if (parentNode) {
				if (!parentNode.children) parentNode.children = [];
				parentNode.children.push(node);
			}
		}
	});

	return rootNodes;
}

// // 根节点
// const rootNodes = metaData.filter(node => !(`${belong}` in node));
//
// // 递归挂载子节点
// function attachChildNodes(node) {
// 	const children = metaData.filter(child => child[belong] === node[locationSite]);
// 	node.children = children;
// 	children.forEach(child => attachChildNodes(child));
// }
//
// rootNodes.forEach(root => attachChildNodes(root));
// return rootNodes;
