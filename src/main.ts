import './style.css'
import * as PIXI from 'pixi.js'
import ElkConstructor, {ElkExtendedEdge, ElkNode, ElkPort} from "elkjs/lib/elk.bundled.js";

// Create a new PIXI application
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0xffffff,
    antialias: true,
});

interface IDemand {
    resourceId: string;
    collected?: boolean;
    dynamic?: boolean;
    extent?: string;
    type?: string;
}

interface ISupply {
    resourceId: string;
    collected?: boolean;
    dynamic?: boolean;
    extent?: string;
}
interface IBehavior {
    id: string;
    extent: string;
    rewires?: { order: string; targets: string[]; };
    demands: IDemand[];
    supplies: ISupply[];
}

interface IPoint {
    x: number;
    y: number;
}

function buildBehavior(behavior: IBehavior) {
    const container = new PIXI.Container();
    container.name = behavior.id;
    const textStyle = new PIXI.TextStyle({
        align: 'right',
        fill: 'black',
        fontSize: 14,
    });

    const topPadding = 0;
    const betweenPadding = 6;

    let hasDynamicDemands: boolean = false;
    let ports: Map<string,IPoint> = new Map();
    let innerPorts: Map<string, IPoint> = new Map();
    let portToBehavior: Map<string, string> = new Map();

    // for each demand create a text object
    let resourceToText: Map<string, PIXI.Text> = new Map();
    let maxDemandWidth = 0;
    for (const demand of behavior.demands) {
        const text: PIXI.Text = new PIXI.Text(demand.resourceId, textStyle);
        if (text.width > maxDemandWidth) {
            maxDemandWidth = text.width;
        }
        resourceToText.set(demand.resourceId, text);
        container.addChild(text);
        if (demand.dynamic) {
            hasDynamicDemands = true;
        }
    }

    let demandY = topPadding;
    for (const demand of behavior.demands) {
        let text = resourceToText.get(demand.resourceId);
        if (text) {
            text.anchor.set(1, 0);
            text.x = maxDemandWidth;
            text.y = demandY;
            let portName = behavior.id + "_" + demand.resourceId;
            ports.set(portName, {x: 0, y: demandY + text.height});
            innerPorts.set(portName, {x: maxDemandWidth, y: demandY + text.height});
            portToBehavior.set(portName, behavior.id);
            demandY += text.height + betweenPadding;
        }
    }
    demandY -= betweenPadding;
    if (behavior.demands.length == 0) {
        const text: PIXI.Text = new PIXI.Text("", textStyle);
        text.anchor.set(1, 0);
        text.x = 0;
        text.y = 0;
        container.addChild(text);
        demandY = 0;
    }

    if (hasDynamicDemands) {
        let portName = "rw_" + behavior.id + "_d";
        // port is middle above demands
        ports.set(portName, {x: Math.round(maxDemandWidth / 2.0), y: 0});
        innerPorts.set(portName, ports.get(portName)!); // set same position so it will look like a direct connection
        portToBehavior.set(portName, behavior.id);
    }

    let maxSupplyWidth = 0;
    let hasDynamicSupplies: boolean = false;
    for (const supply of behavior.supplies) {
        const text = new PIXI.Text(supply.resourceId, textStyle);
        if (text.width > maxSupplyWidth) {
            maxSupplyWidth = text.width;
        }
        resourceToText.set(supply.resourceId, text);
        container.addChild(text);
        if (supply.dynamic) {
            hasDynamicSupplies = true;
        }
    }

    let supplyY = topPadding;
    for (const supply of behavior.supplies) {
        let text = resourceToText.get(supply.resourceId);
        if (text) {
            text.anchor.set(0, 0);
            text.x = maxDemandWidth + 20;
            text.y = supplyY;
            let portName = behavior.id + "_" + supply.resourceId;
            ports.set(portName, {x: maxDemandWidth + 20 + maxSupplyWidth, y: supplyY + text.height})
            innerPorts.set(portName, {x: maxDemandWidth + 20, y: supplyY + text.height});
            portToBehavior.set(portName, behavior.id);
            supplyY += text.height + betweenPadding;
        }
    }
    supplyY -= betweenPadding;

    if (hasDynamicSupplies) {
        let portName = "rw_" + behavior.id + "_s";
        // port is middle above supplies
        ports.set(portName, {x: Math.round(maxSupplyWidth / 2.0) + maxDemandWidth + 20, y: 0});
        innerPorts.set(portName, ports.get(portName)!); // set same position so it will look like a direct connection
        portToBehavior.set(portName, behavior.id);
    }

    const lineGraphics = new PIXI.Graphics();
    lineGraphics.lineStyle()
    lineGraphics.lineStyle({
        width: 6,
        color: 0x000000,
        alpha: 1,
        alignment:0.5,
        cap: PIXI.LINE_CAP.ROUND});
    lineGraphics.moveTo(maxDemandWidth + 10, 0);
    lineGraphics.lineTo(maxDemandWidth + 10, Math.max(demandY, supplyY));
    lineGraphics.endFill();
    container.addChild(lineGraphics);

    if (behavior.rewires) {
        let portName = "rw_" + behavior.id;
        // middle bottom
        ports.set(portName, {x: maxDemandWidth + 10, y: Math.max(demandY, supplyY)});
        innerPorts.set(portName, ports.get(portName)!); // set same position so it will look like a direct connection
        portToBehavior.set(portName, behavior.id);
    }

    return { container, ports, innerPorts, portToBehavior };
}

document.body.appendChild(app.view as HTMLCanvasElement);

const behaviors: IBehavior[] = [
    {
        id: "1",
        extent: "mainExtent",
        demands: [
            {resourceId: "removeCounter",
            dynamic: true,
            extent: "smallExtent1"},
            {resourceId:"addCounter"},
            {resourceId:"anotherThing"}
        ],
        supplies: [
            {resourceId:"nextId"},
            {resourceId:"counters"},
            {resourceId:"2"},
            {resourceId:"3"},
            {resourceId:"4"}
        ]
    },
    {
        id: "2",
        extent: "mainExtent",
        demands: [
            {resourceId:"nextId"},
            {resourceId:"2"}
        ],
        supplies: [
            {resourceId:"aThirdThing"}
        ]
    },
    {
        id: "3",
        extent: "smallExtent1",
        demands: [],
        supplies: [
            {resourceId:"removeCounter"}
        ]
    },
    {
        id: "4",
        extent: "mainExtent",
        demands: [],
        supplies: [
            {resourceId:"addCounter"}
        ]
    },
    {
        id: "5",
        extent: "mainExtent",
        demands: [
            {resourceId:"2"},
            {resourceId:"3"},
            {resourceId:"addCounter"}
        ],
        supplies: []
    },
    {
        id: "6",
        extent: "mainExtent",
        rewires: {order: "pre", targets: ["1"]},
        demands: [
            {resourceId:"something1"}
        ],
        supplies: []
    }
    ]

const edges: ElkExtendedEdge[] = [
    {id: "e1", sources: ["3_removeCounter"], targets: ["1_removeCounter"]},
    {id: "e2", sources: ["1_nextId"], targets: ["2_nextId"]},

    {id: "e3", sources: ["1_2"], targets: ["2_2"]},
    {id: "e4", sources: ["4_addCounter"], targets: ["1_addCounter"]},
    {id: "e5", sources: ["1_2"], targets: ["5_2"]},
    {id: "e6", sources: ["1_3"], targets: ["5_3"]},
    {id: "e7", sources: ["4_addCounter"], targets: ["5_addCounter"]},
    {id: "e8", sources: ["rw_6"], targets: ["rw_1_d"]},
]

let elkjson: any = {}
elkjson["id"] = "root";
elkjson["layoutOptions"] = {
    "elk.algorithm": "layered",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.spacing.nodeNode": "60",
    "elk.spacing.edgeNode": "60",
    "elk.hierarchyHandling": "INCLUDE_CHILDREN"
};

elkjson["children"] = [];

let allInnerPorts: Map<string, IPoint> = new Map();
let allPortToBehavior: Map<string, string> = new Map();

let allExtents: Map<string, ElkNode> = new Map();
let allExtentContainers: Map<string, PIXI.Container> = new Map();

let rootContainer = new PIXI.Container();
rootContainer.name = "root";

app.stage.addChild(rootContainer);

for (let b of behaviors) {
    let extentNode: ElkNode | undefined = allExtents.get(b.extent);
    if (!extentNode) {
        extentNode = {
            id: b.extent,
            children: []
        }
        allExtents.set(b.extent, extentNode);
        let extentContainer = new PIXI.Container();
        extentContainer.name = b.extent;
        rootContainer.addChild(extentContainer);
        allExtentContainers.set(b.extent, extentContainer);
    }
    let extentContainer = allExtentContainers.get(b.extent)!;
    let { container, ports, innerPorts, portToBehavior } = buildBehavior(b);
    extentContainer.addChild(container);
    for (let [key, value] of innerPorts) {
        allInnerPorts.set(key, value);
    }
    for (let [key, value] of portToBehavior) {
        allPortToBehavior.set(key, value);
    }
    let node: ElkNode = {
        id: b.id,
        width: container.width,
        height: container.height,
        layoutOptions: {"elk.portConstraints": "FIXED_POS"}
    };
    let elkPorts: ElkPort[] = []
    for (let [key, value] of ports) {
        elkPorts.push({id: key, x: value.x, y: value.y});
    }
    node["ports"] = elkPorts;
    // @ts-ignore
    extentNode.children.push(node);
}
for (let [, value] of allExtents) {
    elkjson["children"].push(value);
}
elkjson["edges"] = edges;

const elk = new ElkConstructor();
console.log(elkjson);


elk.layout(elkjson).then((g: ElkNode) => {
    console.log(g)
    if (g.children) {
        g.children.forEach((extentChild: ElkNode) => {
            let extentContainer = allExtentContainers.get(extentChild.id)!;
            extentContainer.x = extentChild.x!;
            extentContainer.y = extentChild.y!;
            let bg = new PIXI.Graphics();
            bg.beginFill(0x000000, 0.1);
            bg.drawRoundedRect(0, 0, extentChild.width!, extentChild.height!, 10);
            extentContainer.addChild(bg);
            //extentContainer.width = extentChild.width!;
            //extentContainer.height = extentChild.height!;

            console.log(extentChild);
            // these are extents
            extentChild.children!.forEach((behaviorChild: ElkNode) => {
                let container = extentContainer.getChildByName(behaviorChild.id);
                if (container) {
                    container.x = behaviorChild.x!;
                    container.y = behaviorChild.y!;
                }
            });
        });
    }
    if (g.edges) {
        g.edges.forEach((edge: ElkExtendedEdge) => {
            let container = app.stage.getChildByName(edge.container, true);
            if (edge.sections && edge.sections.length > 0) {
                const lineGraphics = new PIXI.Graphics();
                lineGraphics.blendMode = PIXI.BLEND_MODES.SRC_ATOP;
                lineGraphics.lineStyle({
                    width: 4,
                    color: 0x909090,
                    alpha: 1,
                    alignment:0.5,

                    cap: PIXI.LINE_CAP.ROUND,
                    join: PIXI.LINE_JOIN.ROUND
                });

                // get inner port
                let sourcePortName = edge.sources[0];
                if (sourcePortName.includes("rw_")) {
                }
                //if (edge.sources[0])
                let sourceInnerPort = allInnerPorts.get(edge.sources[0]);
                let sourceBehavior = allPortToBehavior.get(edge.sources[0]);
                let sourceContainer = rootContainer.getChildByName(sourceBehavior!, true);
                let sourcePos = sourceContainer!.toGlobal({x:0, y:0});
                let targetInnerPort = allInnerPorts.get(edge.targets[0]);
                let targetBehavior = allPortToBehavior.get(edge.targets[0]);
                let targetContainer = rootContainer.getChildByName(targetBehavior!, true);
                let targetPos = targetContainer!.toGlobal({x:0, y:0});
                lineGraphics.moveTo(sourceInnerPort!.x + sourcePos.x, sourceInnerPort!.y + sourcePos.y);
                //lineGraphics.moveTo(sourceInnerPort!.x, sourceInnerPort!.y);
                lineGraphics.lineTo(edge.sections[0].startPoint.x + container!.x, edge.sections[0].startPoint.y + container!.y);
                for (let section of edge.sections) {
                    lineGraphics.lineTo(section.endPoint.x + container!.x, section.endPoint.y + container!.y);
                }
                lineGraphics.lineTo(targetInnerPort!.x + targetPos.x, targetInnerPort!.y + targetPos.y);
                lineGraphics.endFill();
                rootContainer.addChild(lineGraphics);
            }
        });
    }
});
