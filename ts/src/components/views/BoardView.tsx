/// <reference path="../../../typings/index.d.ts" />
declare var require: any
import * as React from "react";
import * as ReactDOM from "react-dom";
import {Button} from "./UI"
import {View} from "../models/View"
import {MainMenu} from "./MainMenu"
import {Board} from "../models/BoardModel"
import {Tile} from "../models/TileModel"


export class BoardView extends React.Component<{
        changeView: (newVew: View)=>void
    }, {
        board: Board,
        selectedTile: {x: number, y: number},
        zoom: number,
        scrollX: number,
        scrollY: number,
        dragging: boolean,
        dragPosition: {x: number, y: number}
    }> {

    private tileHeight: number
    private tileWidth: number
    private tileSpacing: number
    
    constructor() {
        super()
        
        this.tileHeight = 300
        var cos30deg = Math.cos(Math.PI/6)
        this.tileWidth = Math.ceil(cos30deg * this.tileHeight)
        this.tileSpacing = 5

        this.state = {
            board: new Board(1, 1),
            selectedTile: null,
            scrollX: 0,
            scrollY: 0,
            zoom: 1,
            dragging: false,
            dragPosition: null
        }
    }

    componentWillMount () {
        this.centerBoard()
    }

    getTilePath(x: number, y: number, originLeft: number, originTop: number) {
        var tileHeight = this.tileHeight
        var tileWidth = this.tileWidth
        var tileSpacing = this.tileSpacing

        var offsetX = (tileWidth + tileSpacing)/2
        var offsetY = tileHeight/4

        var absoluteX = originLeft + x * (tileWidth + tileSpacing) + y * offsetX
        var absoluteY = originTop + y * (tileHeight + tileSpacing - offsetY)

        return {
            top: {x: absoluteX, y: absoluteY},
            topRight: {x: tileWidth/2, y: tileHeight/4},
            bottomRight: {x: 0, y: tileHeight/2},
            bottom: {x: -tileWidth/2, y: tileHeight/4},
            bottomleft: {x: -tileWidth/2, y: -tileHeight/4},
            topLeft: {x: 0, y: -tileHeight/2}
        }
    }

    getBoardPxSize() {
        var bounds = this.state.board.bounds

        var widthMin = (this.tileWidth + this.tileSpacing) * (Math.abs(bounds.widthMin) + 1/2)
        var widthMax = (this.tileWidth + this.tileSpacing) * (Math.abs(bounds.widthMax) + 1/2)

        var heightMin = (this.tileHeight + this.tileSpacing) * (Math.abs(bounds.heightMin) * 3/4)
        var heightMax = (this.tileHeight + this.tileSpacing) * (Math.abs(bounds.heightMax) * 3/4 + 1)

        return {
            widthMin: widthMin,
            widthMax: widthMax,
            heightMin: heightMin,
            heightMax: heightMax
        }
    }

    centerBoard () {
        this.state.scrollX = -this.getBoardPxSize().widthMin
        this.state.scrollY = -this.getBoardPxSize().heightMin - this.tileHeight / 2
        this.setState(this.state)
    }

    handleMenuClick() {
        {this.props.changeView(new View(MainMenu))}
    }

    handleTileClick(e: any) {
        if(this.state.dragging) {
            return
        }
        var xClicked = e.target.getAttribute("data-x")
        var yClicked = e.target.getAttribute("data-y")
        if(this.state.selectedTile && this.state.selectedTile.x == xClicked && this.state.selectedTile.y == yClicked) {
            this.state.selectedTile = null
        } else {
            this.state.selectedTile = {x: xClicked, y: yClicked}
        }
        this.setState(this.state)
    }

    handleAdjacentTileClick(e: any) {
        if(this.state.dragging) {
            return
        }
        var x = e.target.attributes["data-x"].nodeValue
        var y = e.target.attributes["data-y"].nodeValue
        this.state.board.addTile(x, y)
        this.setState(this.state)
    }

    handleOnWheel(e: React.WheelEvent) {
        var sign = e.deltaY / Math.abs(e.deltaY)
        this.state.zoom = Math.max(0.2, Math.min(this.state.zoom - (sign * 0.1), 2.5))
        this.setState(this.state)
    }

    startDrag(e: React.MouseEvent) {
        this.state.dragPosition = {x: e.clientX, y: e.clientY}
    }

    handleDrag(e: React.MouseEvent) {
        if(!this.state.dragPosition) {
            return
        }
        this.state.dragging = true
        this.state.scrollX = this.state.scrollX + (e.clientX - this.state.dragPosition.x) * 1/this.state.zoom
        this.state.scrollY = this.state.scrollY + (e.clientY - this.state.dragPosition.y) * 1/this.state.zoom

        this.state.dragPosition.x = e.clientX
        this.state.dragPosition.y = e.clientY

        this.setState(this.state)
    }

    endDrag(e: React.MouseEvent) {
        this.state.dragPosition = null
        window.setTimeout(
            () => {
                this.state.dragging = false
                this.setState(this.state)
            }, 0
        )
    }

    handleCenterBoardClick() {
        this.centerBoard()
    }

    render() {
        var tiles = this.state.board.tiles
        var adjacents = this.state.board.adjacents
        var paths: any[] = []
        var boardSize = this.getBoardPxSize()
        Object.keys(tiles).map(xIndex => {
            Object.keys(tiles[+xIndex]).map(yIndex => {
                var path = this.getTilePath(+xIndex, +yIndex, boardSize.widthMin, boardSize.heightMin)
                var classNameStart = (+xIndex == 0 && +yIndex == 0 ? "start" : "")
                var classNameSelected = (this.state.selectedTile && +xIndex == this.state.selectedTile.x && +yIndex == this.state.selectedTile.y ? " selected" : "")
                paths.push(
                    <TileView
                        tile={tiles[xIndex][yIndex]}
                        onClick={this.handleTileClick.bind(this)}
                        className={classNameStart + classNameSelected}
                        path={path}
                        key={xIndex + "_" + yIndex}
                        x={xIndex}
                        y={yIndex}
                        width={this.tileWidth}
                        height={this.tileHeight}>
                    </TileView>
                )
            })
        })
        Object.keys(adjacents).map(xIndex => {
            Object.keys(adjacents[+xIndex]).map(yIndex => {
                var path = this.getTilePath(+xIndex, +yIndex, boardSize.widthMin, boardSize.heightMin)
                var classNameStart = (+xIndex == 0 && +yIndex == 0 ? "start" : "")
                paths.push(
                    <TileView
                        tile={adjacents[xIndex][yIndex]}
                        onClick={this.handleAdjacentTileClick.bind(this)}
                        className={"tile adjacent" + classNameStart}
                        path={path}
                        key={"a" + xIndex + "_" + yIndex}
                        x={xIndex}
                        y={yIndex}
                        width={this.tileWidth}
                        height={this.tileHeight}>
                    </TileView>
                )
            })
        })

        var svgTranslate = this.state.scrollX && this.state.scrollY ? ("translate(" + this.state.scrollX + "px," + this.state.scrollY + "px) ") : ""
        var svgTransform: string = svgTranslate
        var boardZoom = "scale(" + this.state.zoom + ") "
        var boardCenter = "translate(-50%, -50%)"
        var boardTransform = boardZoom + boardCenter

        return (
            <div id="view-board" className="view">
                <Button text="Main Menu" id="board-main-menu-button" onClick={this.handleMenuClick.bind(this)}></Button>
                <Button text="Center Board" id="board-center-button" onClick={this.handleCenterBoardClick.bind(this)}></Button>
                <div
                    id="board"
                    onMouseDown={this.startDrag.bind(this)}
                    onMouseMove={this.handleDrag.bind(this)}
                    onMouseUp={this.endDrag.bind(this)}
                    onWheel={this.handleOnWheel.bind(this)}>
                    <div id="board-center" style={{transform: boardTransform}}>
                        <svg
                            id="board-svg"
                            width={boardSize.widthMin + boardSize.widthMax}
                            height={boardSize.heightMin + boardSize.heightMax}
                            style={{transform: svgTransform}}>
                            <g id="board-g">
                                {paths.map(path =>
                                    path
                                )}
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
        )
    }
}

export class TileView extends React.Component<{
        tile: Tile,
        onClick?: (e: React.MouseEvent | React.TouchEvent)=>void,
        className?: string,
        path: {
            top: {x: number, y: number},
            topRight: {x: number, y: number},
            bottomRight: {x: number, y: number},
            bottom: {x: number, y: number},
            bottomleft: {x: number, y: number},
            topLeft: {x: number, y: number}
        },
        x: string,
        y: string,
        height: number,
        width: number,
    }, {
    }> {
    
    constructor() {
        super()
    }

    componentDidMount () {
        if(this.props.x == "0" && this.props.y == "0") {
            return
        }
        var path = (this.refs as any).path
        if(path) {
            var pathLength = path.getTotalLength()
            path.style = "stroke-dasharray: " + (pathLength / 500) + "em"
        }
    }

    handlePathClick (e: React.MouseEvent | React.TouchEvent) {
        if(this.props.onClick instanceof Function) {
            this.props.onClick(e)
        }
    }

    render() {
        var img: any
        if (this.props.tile && this.props.tile.type) {
            img = require('../../../assets/images/' + this.props.tile.type.textureName + this.props.tile.textureVariant + ".png")
        }
        var path = this.props.path
        var d = "M " + path.top.x + "," + path.top.y
            + " l " + path.topRight.x + "," + path.topRight.y
            + " l " + path.bottomRight.x + "," + path.bottomRight.y
            + " l " + path.bottom.x + "," + path.bottom.y
            + " l " + path.bottomleft.x + "," + path.bottomleft.y
            + " l " + path.topLeft.x + "," + path.topLeft.y + "z"

        var className = "tile" + (this.props.className ? " " + this.props.className : "")

        return (
            <g >
                {this.props.tile && this.props.tile.type ? 
                    <image
                        className={"tile-image" + (this.props.className ? " " + this.props.className : "")}
                        xlinkHref={img}
                        x={path.top.x}
                        y={path.top.y}
                        height={this.props.height}
                        width={this.props.width}>
                    </image> : null
                }
                <path
                    ref="path"
                    onClick={this.handlePathClick.bind(this)}
                    className={className}
                    d={d}
                    data-x={this.props.x}
                    data-y={this.props.y}>
                </path>
            </g>
        )
    }
}