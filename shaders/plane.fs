#version 420 core
layout (std140, binding = 0) uniform lights
{                               //base alignment    base offset     alignment offset        used bytes
    int index;                  //  4               0                0                      0.. 3
    vec4 light[500];             //  160             4                16 (16 per index)     16.. 175
    vec4 lightcolours[500];      //  160             176              176                  
};

//in variables
in VS_OUT
{
    vec2 texCoord;
    vec3 tangentWorldPos;
    vec3 tangentCampos;
    vec3 tangentNormal;
} vs_in;


//texture samplers
uniform sampler2D texture_diffuse1;
uniform sampler2D texture_normal1;
uniform sampler2D texture_height1;
uniform sampler2D texture_metallic1;
uniform sampler2D texture_roughness1;
uniform sampler2D texture_ambientocclusion1;

const float PI = 3.14159265359;
const float gamma = 2.2;


//ratio of reflected light on a surface
 vec3 frenelSchlick(float cosTheta, vec3 F0)
 {
     return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
 }

//normal or specular distribution "D"
//indicate the amount of microfacets aligning with the halfwayvector
 float DistributionGGX(vec3 normal, vec3 halfwayvec, float roughness)
 {
    float r = roughness*roughness;
    float r2 = r*r;
    float NdotH = max(dot(normal, halfwayvec), 0.0 );
    float NdotH2 = NdotH*NdotH;

    float numerator = r2;
    float denominator = NdotH2 *(r2 - 1.0) + 1.0;
    denominator = PI * denominator * denominator;

    return numerator / denominator;
 }

//calculate overshadowing(obstruction) of surface microfacets
//geometry schlick ggx
 float GSchlickGGX(float NdotV, float roughness)
 {
    float r = roughness + 1.0;
    float kdirect = (r*r) / 8.0;
    
    float numerator = NdotV;
    float denominator = (NdotV*(1.0 - kdirect) + kdirect);

    return numerator/denominator;
 }
//Smith's method to take view obstruction and light obstruction both into account
float SmithGGX(vec3 normal, vec3 viewdir, vec3 lightdir, float roughness)
{
    float NdotV = max( dot( normal, viewdir), 0.0);
    float NdotL = max( dot( normal, lightdir), 0.0);

    float gsub1 = GSchlickGGX(NdotV, roughness);
    float gsub2 = GSchlickGGX(NdotL, roughness);

    return gsub1*gsub2;
}

out vec4 fragcolor;
void main()
{
    //vec3 normal = vs_in.tangentNormal;

    //texinfo
    vec3 diffuse = pow( texture2D(texture_diffuse1, vec2(vs_in.texCoord.x, 1-vs_in.texCoord.y)).rgb, vec3(gamma));

    vec3 normal = normalize(texture2D(texture_normal1, vec2(vs_in.texCoord.x, 1-vs_in.texCoord.y)).rgb);
    normal = normalize(normal * 2 - 1);

    float height = texture2D(texture_height1, vec2(vs_in.texCoord.x, 1-vs_in.texCoord.y)).x;
    float roughness = texture2D(texture_roughness1, vec2(vs_in.texCoord.x, 1-vs_in.texCoord.y)).x;
    float metallic = texture2D(texture_metallic1, vec2(vs_in.texCoord.x, 1-vs_in.texCoord.y)).x;
    float ao = texture2D(texture_ambientocclusion1, vec2(vs_in.texCoord.x, 1-vs_in.texCoord.y)).x;
    
    
    //light-out direction(V)
    vec3 LoDir = normalize((vs_in.tangentCampos - vs_in.tangentWorldPos));

    //radiance out
    vec3 Lo = vec3(0.0); 

    //loop over lights
    for( int i = 0; i < index; i++)
    {
        //light-in direction(L)
        vec3 LiDir = normalize(light[i].xzy - vs_in.tangentWorldPos); //z and y positions are exchanged for some reason
        //halfway vector(H)
        vec3 halfwayVec =  normalize(LoDir + LiDir);


        //brightness
        float dist = length(light[i].xzy - vs_in.tangentWorldPos);
        float attenuation = 1.0 /(dist * dist); //TEST FULL ATTENUATION //andere attenuation misschien(meer controle?)
        vec3 radiance = lightcolours[i].rgb * attenuation; 
    
        ////Calculating Cook-Torrace specular BRDF////
        //reflectance at zero incidence, base reflectance
        //simplified assumption that most dialectric surfaces have a visually correct base reflectance of 0.04
        vec3 F0 = vec3(0.04);
        F0 = mix(F0, diffuse, metallic);
        vec3 F = frenelSchlick( max( dot(halfwayVec, LoDir), 0.0), F0);

        //NDF and GGX
        float NDF = DistributionGGX(normal, halfwayVec, roughness);
        float G = SmithGGX(normal, LoDir, LiDir, roughness);

        //BRDF Cook-Torrace, specular
        //DFG
        vec3 numerator = NDF * F * G;
        float denominator = 4.0 * max(dot(normal, LoDir),0.0) * max(dot(normal, LiDir), 0.0);
        vec3 specular = numerator/max(denominator, 0.001);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        //metallic surface doesn't refract light, so undo this when it's metallic
        kD *= 1.0-metallic;

        float NdotL = max(dot(normal, LiDir), 0.0);
        Lo += (kD * diffuse / PI + specular) * radiance * NdotL;
    }

    //improvised ambient for now
    vec3 ambient = vec3(0.08) * diffuse * ao;
    vec3 color = ambient + Lo;

    fragcolor = vec4 ( pow(color, vec3(1.0/gamma)), 1.0);
}